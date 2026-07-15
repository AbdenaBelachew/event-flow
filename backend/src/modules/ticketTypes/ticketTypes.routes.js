const express = require("express");
const { query } = require("../../config/db");
const asyncHandler = require("../../utils/asyncHandler");
const { ApiError } = require("../../utils/ApiError");
const { authRequired } = require("../../middleware/auth");
const { roleGuard } = require("../../middleware/roleGuard");

// mergeParams so /events/:eventId/ticket-types can read eventId
const router = express.Router({ mergeParams: true });

async function loadEventOwned(req, eventId) {
  const { rows } = await query(`SELECT * FROM events WHERE id = $1`, [eventId]);
  if (!rows.length) throw new ApiError(404, "Event not found");
  const event = rows[0];
  if (req.user.role !== "super_admin" && req.user.company_id !== event.company_id) {
    throw new ApiError(403, "You do not own this event");
  }
  return event;
}

function assertEventWritable(req, event) {
  if (event.is_locked && req.user.role !== "super_admin") {
    throw new ApiError(403, "This event is locked by the platform owner");
  }
}

// GET /api/events/:eventId/ticket-types   (public list of active types)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT * FROM ticket_types WHERE event_id = $1 ORDER BY price_etb ASC`,
      [req.params.eventId]
    );
    res.json({ ticket_types: rows });
  })
);

// POST /api/events/:eventId/ticket-types   (owner)
router.post(
  "/",
  authRequired,
  roleGuard("company_admin"),
  asyncHandler(async (req, res) => {
    const event = await loadEventOwned(req, req.params.eventId);
    assertEventWritable(req, event);
    const { name, price_etb, quantity_total, sales_start, sales_end, max_per_order } =
      req.body || {};
    if (!name || price_etb === undefined || !quantity_total) {
      throw new ApiError(400, "name, price_etb, quantity_total are required");
    }
    if (Number(price_etb) < 0) throw new ApiError(400, "price_etb must be >= 0");
    if (Number(quantity_total) <= 0) throw new ApiError(400, "quantity_total must be > 0");

    const { rows } = await query(
      `INSERT INTO ticket_types
         (event_id, name, price_etb, quantity_total, sales_start, sales_end, max_per_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        req.params.eventId, name, price_etb, quantity_total,
        sales_start || null, sales_end || null, max_per_order || 10,
      ]
    );
    res.status(201).json({ ticket_type: rows[0] });
  })
);

// PATCH /api/ticket-types/:id   (owner)  — mounted at /ticket-types
router.patch(
  "/:id",
  authRequired,
  roleGuard("company_admin"),
  asyncHandler(async (req, res) => {
    const existing = await query(`SELECT * FROM ticket_types WHERE id = $1`, [req.params.id]);
    if (!existing.rows.length) throw new ApiError(404, "Ticket type not found");
    const event = await loadEventOwned(req, existing.rows[0].event_id);
    assertEventWritable(req, event);

    const allowed = [
      "name", "price_etb", "quantity_total",
      "sales_start", "sales_end", "max_per_order", "is_active",
    ];
    const sets = [];
    const values = [];
    let i = 1;
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        sets.push(`${key} = $${i++}`);
        values.push(req.body[key]);
      }
    }
    if (!sets.length) throw new ApiError(400, "No updatable fields provided");
    values.push(req.params.id);

    const { rows } = await query(
      `UPDATE ticket_types SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
      values
    );
    res.json({ ticket_type: rows[0] });
  })
);

module.exports = router;
