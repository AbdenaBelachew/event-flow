const express = require("express");
const { query, withTransaction } = require("../../config/db");
const asyncHandler = require("../../utils/asyncHandler");
const { ApiError } = require("../../utils/ApiError");
const { getGateway } = require("./gateways");
const { issueTicketsForOrder, releaseOrder } = require("../tickets/tickets.service");

const router = express.Router();

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
      if (payment.status !== "initiated") return { idempotent: true, status: payment.status };
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
