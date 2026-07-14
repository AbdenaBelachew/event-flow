const express = require("express");
const { query, withTransaction } = require("../../config/db");
const asyncHandler = require("../../utils/asyncHandler");
const { ApiError } = require("../../utils/ApiError");
const { authRequired } = require("../../middleware/auth");
const { roleGuard } = require("../../middleware/roleGuard");
const { getGateway } = require("./gateways");
const { issueTicketsForOrder, releaseOrder } = require("../tickets/tickets.service");

const router = express.Router();

function assertOwnsPaymentEvent(req, companyId) {
  if (req.user.role === "super_admin") return;
  if (req.user.company_id !== companyId) {
    throw new ApiError(403, "You do not own this payment");
  }
}

/**
 * GET /api/payments/pending?event_id=
 * Admin: list payments awaiting approval (optionally filtered by event).
 */
router.get(
  "/pending",
  authRequired,
  roleGuard("company_admin", "super_admin"),
  asyncHandler(async (req, res) => {
    const eventId = req.query.event_id || null;
    const params = [];
    let where = `p.status = 'awaiting_approval'`;

    if (req.user.role === "company_admin") {
      params.push(req.user.company_id);
      where += ` AND e.company_id = $${params.length}`;
    }
    if (eventId) {
      params.push(eventId);
      where += ` AND o.event_id = $${params.length}`;
    }

    const { rows } = await query(
      `SELECT p.id, p.order_id, p.gateway, p.gateway_ref, p.amount_etb, p.status,
              p.buyer_tx_code, p.buyer_reference, p.created_at, p.updated_at,
              o.buyer_name, o.buyer_email, o.buyer_phone, o.event_id,
              e.title AS event_title
       FROM payments p
       JOIN orders o ON o.id = p.order_id
       JOIN events e ON e.id = o.event_id
       WHERE ${where}
       ORDER BY p.updated_at ASC`,
      params
    );

    res.json({ payments: rows });
  })
);

/**
 * POST /api/payments/:id/approve
 * Admin confirms the buyer's phone payment → issue tickets + unlock QR codes.
 */
router.post(
  "/:id/approve",
  authRequired,
  roleGuard("company_admin", "super_admin"),
  asyncHandler(async (req, res) => {
    const note = (req.body && req.body.note) || null;

    const out = await withTransaction(async (client) => {
      const payRes = await client.query(
        `SELECT p.*, e.company_id, o.status AS order_status
         FROM payments p
         JOIN orders o ON o.id = p.order_id
         JOIN events e ON e.id = o.event_id
         WHERE p.id = $1
         FOR UPDATE OF p`,
        [req.params.id]
      );
      if (!payRes.rows.length) throw new ApiError(404, "Payment not found");
      const payment = payRes.rows[0];
      assertOwnsPaymentEvent(req, payment.company_id);

      if (payment.status === "success") {
        return { idempotent: true, status: "success", order_id: payment.order_id };
      }
      if (payment.status !== "awaiting_approval") {
        throw new ApiError(409, `Payment is ${payment.status}, not awaiting approval`);
      }

      await client.query(
        `UPDATE payments
         SET status = 'success',
             reviewed_by = $1,
             reviewed_at = now(),
             review_note = $2,
             updated_at = now()
         WHERE id = $3`,
        [req.user.id, note, payment.id]
      );
      await issueTicketsForOrder(client, payment.order_id);
      return { idempotent: false, status: "success", order_id: payment.order_id };
    });

    res.json({
      message: "Payment approved. Tickets are now valid.",
      ...out,
    });
  })
);

/**
 * POST /api/payments/:id/reject
 * Admin rejects the proof — order fails and stock is released.
 */
router.post(
  "/:id/reject",
  authRequired,
  roleGuard("company_admin", "super_admin"),
  asyncHandler(async (req, res) => {
    const note = (req.body && req.body.note) || "Payment rejected by admin";

    const out = await withTransaction(async (client) => {
      const payRes = await client.query(
        `SELECT p.*, e.company_id
         FROM payments p
         JOIN orders o ON o.id = p.order_id
         JOIN events e ON e.id = o.event_id
         WHERE p.id = $1
         FOR UPDATE OF p`,
        [req.params.id]
      );
      if (!payRes.rows.length) throw new ApiError(404, "Payment not found");
      const payment = payRes.rows[0];
      assertOwnsPaymentEvent(req, payment.company_id);

      if (payment.status === "failed") {
        return { idempotent: true, status: "failed", order_id: payment.order_id };
      }
      if (payment.status === "success") {
        throw new ApiError(409, "Payment already approved");
      }
      if (payment.status !== "awaiting_approval" && payment.status !== "initiated") {
        throw new ApiError(409, `Cannot reject payment in status ${payment.status}`);
      }

      await client.query(
        `UPDATE payments
         SET status = 'failed',
             reviewed_by = $1,
             reviewed_at = now(),
             review_note = $2,
             updated_at = now()
         WHERE id = $3`,
        [req.user.id, note, payment.id]
      );
      await releaseOrder(client, payment.order_id, "failed");
      return { idempotent: false, status: "failed", order_id: payment.order_id };
    });

    res.json({
      message: "Payment rejected. Order cancelled and stock released.",
      ...out,
    });
  })
);

/**
 * POST /api/payments/webhook/:gateway
 * Gateway callback -> confirm/fail the order.
 *
 * IDEMPOTENT: providers retry. We look up the payment by (gateway, gateway_ref)
 * and short-circuit if it is already in a terminal state, so tickets are never
 * issued twice and stock is never double-counted.
 */
router.post(
  "/webhook/:gateway",
  asyncHandler(async (req, res) => {
    const gatewayName = req.params.gateway;
    const gateway = getGateway(gatewayName); // throws on unknown gateway

    const parsed = await gateway.parseWebhook(req);
    if (!parsed.gateway_ref) {
      throw new ApiError(400, "Missing gateway reference");
    }

    const out = await withTransaction(async (client) => {
      // Lock the payment row for idempotency.
      const payRes = await client.query(
        `SELECT * FROM payments WHERE gateway = $1 AND gateway_ref = $2 FOR UPDATE`,
        [gatewayName, parsed.gateway_ref]
      );
      if (!payRes.rows.length) {
        throw new ApiError(404, "Payment not found for reference");
      }
      const payment = payRes.rows[0];

      // Already processed -> no-op (idempotent).
      if (payment.status === "success" || payment.status === "failed") {
        return { idempotent: true, status: payment.status, order_id: payment.order_id };
      }

      if (parsed.status === "success") {
        await client.query(
          `UPDATE payments SET status = 'success', raw_response = $1, updated_at = now() WHERE id = $2`,
          [parsed.raw || null, payment.id]
        );
        await issueTicketsForOrder(client, payment.order_id);
        return { idempotent: false, status: "success", order_id: payment.order_id };
      }

      // Failure -> release reserved stock, void tickets.
      await client.query(
        `UPDATE payments SET status = 'failed', raw_response = $1, updated_at = now() WHERE id = $2`,
        [parsed.raw || null, payment.id]
      );
      await releaseOrder(client, payment.order_id, "failed");
      return { idempotent: false, status: "failed", order_id: payment.order_id };
    });

    res.json({ received: true, ...out });
  })
);

// GET /api/payments/webhook/:gateway  — some gateways ping via GET on return
router.get(
  "/webhook/:gateway",
  asyncHandler(async (req, res) => {
    // Delegate to the same logic by faking a POST-style body from the query.
    req.body = { ...req.query };
    const gateway = getGateway(req.params.gateway);
    const parsed = await gateway.parseWebhook(req);
    if (!parsed.gateway_ref) return res.json({ received: true, note: "no ref" });

    const out = await withTransaction(async (client) => {
      const payRes = await client.query(
        `SELECT * FROM payments WHERE gateway = $1 AND gateway_ref = $2 FOR UPDATE`,
        [req.params.gateway, parsed.gateway_ref]
      );
      if (!payRes.rows.length) return { note: "payment not found" };
      const payment = payRes.rows[0];
      if (payment.status === "success" || payment.status === "failed") {
        return { idempotent: true, status: payment.status };
      }
      if (parsed.status === "success") {
        await client.query(
          `UPDATE payments SET status='success', updated_at=now() WHERE id=$1`,
          [payment.id]
        );
        await issueTicketsForOrder(client, payment.order_id);
        return { status: "success", order_id: payment.order_id };
      }
      await client.query(`UPDATE payments SET status='failed', updated_at=now() WHERE id=$1`, [
        payment.id,
      ]);
      await releaseOrder(client, payment.order_id, "failed");
      return { status: "failed", order_id: payment.order_id };
    });

    res.json({ received: true, ...out });
  })
);

module.exports = router;
