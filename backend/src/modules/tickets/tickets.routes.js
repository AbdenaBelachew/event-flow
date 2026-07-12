const express = require("express");
const { query, withTransaction } = require("../../config/db");
const asyncHandler = require("../../utils/asyncHandler");
const { ApiError } = require("../../utils/ApiError");
const { authRequired } = require("../../middleware/auth");
const { roleGuard } = require("../../middleware/roleGuard");
const { checkInLimiter } = require("../../middleware/rateLimit");
const { ticketQrDataUrl } = require("../../utils/qrGenerator");

const router = express.Router();

// GET /api/tickets/:code   (fetch ticket + QR)
router.get(
  "/:code",
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT t.*, tt.name AS ticket_type, tt.price_etb,
              e.title AS event_title, e.venue, e.city, e.event_start
       FROM tickets t
       JOIN ticket_types tt ON tt.id = t.ticket_type_id
       JOIN events e ON e.id = t.event_id
       WHERE t.ticket_code = $1`,
      [req.params.code]
    );
    if (!rows.length) throw new ApiError(404, "Ticket not found");
    const ticket = rows[0];
    const qr = await ticketQrDataUrl(ticket.ticket_code);
    res.json({ ticket, qr_data_url: qr });
  })
);

/**
 * POST /api/tickets/:code/check-in   (event_staff — the scan endpoint)
 *
 * Implements the exact validation from the spec. Every attempt writes a row to
 * check_ins for the audit trail. The valid->used transition is guarded by a
 * row lock so two simultaneous scans can't both succeed (anti-duplication).
 */
router.post(
  "/:code/check-in",
  checkInLimiter,
  authRequired,
  roleGuard("event_staff", "company_admin"),
  asyncHandler(async (req, res) => {
    const staffId = req.user.id;

    const outcome = await withTransaction(async (client) => {
      // Lock the ticket row (if it exists) to serialize concurrent scans.
      const tRes = await client.query(
        `SELECT * FROM tickets WHERE ticket_code = $1 FOR UPDATE`,
        [req.params.code]
      );

      // 1) Not found -> invalid
      if (!tRes.rows.length) {
        return { result: "invalid", http: 404, ticket: null };
      }
      const ticket = tRes.rows[0];

      // Determine scanning staff's allowed event.
      // event_staff is scoped to assigned_event_id; company_admin to company.
      if (req.user.role === "event_staff") {
        if (!req.user.assigned_event_id || req.user.assigned_event_id !== ticket.event_id) {
          await logCheckIn(client, ticket.id, staffId, "wrong_event");
          return { result: "wrong_event", http: 409, ticket };
        }
      } else if (req.user.role === "company_admin") {
        const ev = await client.query(`SELECT company_id FROM events WHERE id = $1`, [
          ticket.event_id,
        ]);
        if (!ev.rows.length || ev.rows[0].company_id !== req.user.company_id) {
          await logCheckIn(client, ticket.id, staffId, "wrong_event");
          return { result: "wrong_event", http: 409, ticket };
        }
      }

      // 2) unpaid -> reject
      if (ticket.status === "unpaid") {
        await logCheckIn(client, ticket.id, staffId, "unpaid");
        return { result: "unpaid", http: 402, ticket };
      }

      // void/refunded -> invalid
      if (ticket.status === "void" || ticket.status === "refunded") {
        await logCheckIn(client, ticket.id, staffId, "invalid");
        return { result: "invalid", http: 409, ticket };
      }

      // 3) used -> already_used (show original used_at)
      if (ticket.status === "used") {
        await logCheckIn(client, ticket.id, staffId, "already_used");
        return { result: "already_used", http: 409, ticket };
      }

      // 4) valid -> mark used
      if (ticket.status === "valid") {
        const upd = await client.query(
          `UPDATE tickets SET status = 'used', used_at = now() WHERE id = $1 RETURNING *`,
          [ticket.id]
        );
        await logCheckIn(client, ticket.id, staffId, "success");
        return { result: "success", http: 200, ticket: upd.rows[0] };
      }

      await logCheckIn(client, ticket.id, staffId, "invalid");
      return { result: "invalid", http: 409, ticket };
    });

    const messages = {
      success: "Checked in ✓",
      already_used: `Already used at ${outcome.ticket?.used_at || "unknown time"}`,
      unpaid: "Ticket not paid",
      invalid: "Invalid ticket",
      wrong_event: "Ticket is for a different event",
    };

    res.status(outcome.http).json({
      result: outcome.result,
      message: messages[outcome.result],
      ticket: outcome.ticket
        ? {
            ticket_code: outcome.ticket.ticket_code,
            holder_name: outcome.ticket.holder_name,
            status: outcome.ticket.status,
            used_at: outcome.ticket.used_at,
          }
        : null,
    });
  })
);

async function logCheckIn(client, ticketId, staffId, result) {
  await client.query(
    `INSERT INTO check_ins (ticket_id, scanned_by, result) VALUES ($1,$2,$3)`,
    [ticketId, staffId, result]
  );
}

module.exports = router;
