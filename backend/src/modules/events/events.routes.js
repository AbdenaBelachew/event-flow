const express = require("express");
const { query } = require("../../config/db");
const asyncHandler = require("../../utils/asyncHandler");
const { ApiError } = require("../../utils/ApiError");
const { authRequired } = require("../../middleware/auth");
const { roleGuard } = require("../../middleware/roleGuard");

const router = express.Router();

function assertSameCompany(req, companyId) {
  if (req.user.role === "super_admin") return;
  if (req.user.company_id !== companyId) {
    throw new ApiError(403, "You do not own this event");
  }
}

async function loadEvent(id) {
  const { rows } = await query(`SELECT * FROM events WHERE id = $1`, [id]);
  if (!rows.length) throw new ApiError(404, "Event not found");
  return rows[0];
}

// GET /api/events  (authenticated: lists their company's events; public: lists all published events)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    let rows;
    
    // If authenticated as company_admin, return their company's events
    if (req.user && req.user.role === "company_admin") {
      const result = await query(
        `SELECT * FROM events WHERE company_id = $1 ORDER BY event_start DESC`,
        [req.user.company_id]
      );
      rows = result.rows;
    } else {
      // Public request: return only published events
      const result = await query(
        `SELECT * FROM events WHERE status = 'published' ORDER BY event_start DESC`
      );
      rows = result.rows;
    }
    
    res.json({ events: rows });
  })
);

// POST /api/events   (company_admin)
router.post(
  "/",
  authRequired,
  roleGuard("company_admin"),
  asyncHandler(async (req, res) => {
    const {
      title, description, venue, city,
      event_start, event_end, sales_start, sales_end, cover_image_url,
    } = req.body || {};

    if (!title || !event_start || !event_end || !sales_start || !sales_end) {
      throw new ApiError(400, "title, event_start, event_end, sales_start, sales_end are required");
    }
    if (new Date(sales_start) >= new Date(sales_end)) {
      throw new ApiError(400, "sales_start must be before sales_end");
    }
    if (new Date(sales_end) > new Date(event_end)) {
      throw new ApiError(400, "sales_end must be on or before event_end");
    }

    const { rows } = await query(
      `INSERT INTO events
         (company_id, title, description, venue, city,
          event_start, event_end, sales_start, sales_end, cover_image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        req.user.company_id, title, description || null, venue || null, city || null,
        event_start, event_end, sales_start, sales_end, cover_image_url || null,
      ]
    );
    res.status(201).json({ event: rows[0] });
  })
);

// GET /api/events/:id  (public — published events; owners can view any status)
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const event = await loadEvent(req.params.id);
    res.json({ event });
  })
);

// PATCH /api/events/:id  (company_admin owner)
router.patch(
  "/:id",
  authRequired,
  roleGuard("company_admin"),
  asyncHandler(async (req, res) => {
    const event = await loadEvent(req.params.id);
    assertSameCompany(req, event.company_id);

    const allowed = [
      "title", "description", "venue", "city",
      "event_start", "event_end", "sales_start", "sales_end",
      "status", "cover_image_url",
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
    values.push(event.id);

    const { rows } = await query(
      `UPDATE events SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
      values
    );
    res.json({ event: rows[0] });
  })
);

// POST /api/events/:id/publish
router.post(
  "/:id/publish",
  authRequired,
  roleGuard("company_admin"),
  asyncHandler(async (req, res) => {
    const event = await loadEvent(req.params.id);
    assertSameCompany(req, event.company_id);

    const tt = await query(
      `SELECT COUNT(*)::int AS c FROM ticket_types WHERE event_id = $1 AND is_active = true`,
      [event.id]
    );
    if (tt.rows[0].c === 0) {
      throw new ApiError(400, "Add at least one active ticket type before publishing");
    }
    const { rows } = await query(
      `UPDATE events SET status = 'published' WHERE id = $1 RETURNING *`,
      [event.id]
    );
    res.json({ event: rows[0] });
  })
);

// GET /api/events/:id/availability   (PUBLIC — live counts per ticket type)
router.get(
  "/:id/availability",
  asyncHandler(async (req, res) => {
    const event = await loadEvent(req.params.id);
    const now = new Date();
    const { rows } = await query(
      `SELECT id, name, price_etb, quantity_total, quantity_sold, max_per_order,
              sales_start, sales_end, is_active
       FROM ticket_types
       WHERE event_id = $1 AND is_active = true
       ORDER BY price_etb ASC`,
      [event.id]
    );

    const eventOnSale =
      event.status === "published" &&
      now >= new Date(event.sales_start) &&
      now <= new Date(event.sales_end);

    const types = rows.map((t) => {
      const remaining = t.quantity_total - t.quantity_sold;
      const windowStart = t.sales_start ? new Date(t.sales_start) : new Date(event.sales_start);
      const windowEnd = t.sales_end ? new Date(t.sales_end) : new Date(event.sales_end);
      const onSale = eventOnSale && now >= windowStart && now <= windowEnd && remaining > 0;
      return {
        id: t.id,
        name: t.name,
        price_etb: Number(t.price_etb),
        remaining,
        max_per_order: t.max_per_order,
        sold_out: remaining <= 0,
        on_sale: onSale,
      };
    });

    res.json({
      event: {
        id: event.id,
        title: event.title,
        venue: event.venue,
        city: event.city,
        status: event.status,
        event_start: event.event_start,
        sales_end: event.sales_end,
        cover_image_url: event.cover_image_url,
        description: event.description,
      },
      on_sale: eventOnSale,
      ticket_types: types,
    });
  })
);

// GET /api/events/:id/stats  (owner)
router.get(
  "/:id/stats",
  authRequired,
  roleGuard("company_admin", "event_staff"),
  asyncHandler(async (req, res) => {
    const event = await loadEvent(req.params.id);
    if (req.user.role === "company_admin") assertSameCompany(req, event.company_id);
    if (req.user.role === "event_staff" && req.user.assigned_event_id !== event.id) {
      throw new ApiError(403, "Staff not assigned to this event");
    }

    const totals = await query(
      `SELECT
         COALESCE(SUM(quantity_total),0)::int AS capacity,
         COALESCE(SUM(quantity_sold),0)::int  AS sold
       FROM ticket_types WHERE event_id = $1`,
      [event.id]
    );
    const revenue = await query(
      `SELECT COALESCE(SUM(total_amount_etb),0)::numeric AS revenue
       FROM orders WHERE event_id = $1 AND status = 'paid'`,
      [event.id]
    );
    const checked = await query(
      `SELECT COUNT(*)::int AS c FROM tickets WHERE event_id = $1 AND status = 'used'`,
      [event.id]
    );
    const validIssued = await query(
      `SELECT COUNT(*)::int AS c FROM tickets WHERE event_id = $1 AND status IN ('valid','used')`,
      [event.id]
    );
    const byType = await query(
      `SELECT name, quantity_total, quantity_sold, price_etb,
              (quantity_sold * price_etb)::numeric AS revenue
       FROM ticket_types WHERE event_id = $1 ORDER BY price_etb ASC`,
      [event.id]
    );

    const issued = validIssued.rows[0].c;
    const checkedIn = checked.rows[0].c;
    res.json({
      capacity: totals.rows[0].capacity,
      sold: totals.rows[0].sold,
      revenue_etb: Number(revenue.rows[0].revenue),
      tickets_issued: issued,
      checked_in: checkedIn,
      no_show: Math.max(issued - checkedIn, 0),
      no_show_rate: issued ? Number(((issued - checkedIn) / issued).toFixed(3)) : 0,
      by_ticket_type: byType.rows.map((r) => ({
        name: r.name,
        quantity_total: r.quantity_total,
        quantity_sold: r.quantity_sold,
        price_etb: Number(r.price_etb),
        revenue_etb: Number(r.revenue),
      })),
    });
  })
);

// GET /api/events/:id/export  (owner) — CSV of tickets/attendees
router.get(
  "/:id/export",
  authRequired,
  roleGuard("company_admin"),
  asyncHandler(async (req, res) => {
    const event = await loadEvent(req.params.id);
    assertSameCompany(req, event.company_id);

    const { rows } = await query(
      `SELECT t.ticket_code, tt.name AS ticket_type, t.holder_name, t.status,
              o.buyer_name, o.buyer_email, o.buyer_phone, t.issued_at, t.used_at
       FROM tickets t
       JOIN ticket_types tt ON tt.id = t.ticket_type_id
       JOIN orders o ON o.id = t.order_id
       WHERE t.event_id = $1
       ORDER BY t.issued_at ASC`,
      [event.id]
    );

    const header = [
      "ticket_code", "ticket_type", "holder_name", "status",
      "buyer_name", "buyer_email", "buyer_phone", "issued_at", "used_at",
    ];
    const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      header.join(","),
      ...rows.map((r) => header.map((h) => escape(r[h])).join(",")),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="event-${event.id}-tickets.csv"`);
    res.send(csv);
  })
);

module.exports = router;
