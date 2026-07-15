const express = require("express");
const bcrypt = require("bcryptjs");
const { query, withTransaction } = require("../../config/db");
const asyncHandler = require("../../utils/asyncHandler");
const { ApiError } = require("../../utils/ApiError");
const { authRequired } = require("../../middleware/auth");
const { roleGuard } = require("../../middleware/roleGuard");

const router = express.Router();

// All admin routes require platform owner (super_admin).
router.use(authRequired, roleGuard("super_admin"));

// GET /api/admin/overview — platform-wide counts
router.get(
  "/overview",
  asyncHandler(async (_req, res) => {
    const { rows } = await query(`
      SELECT
        (SELECT COUNT(*)::int FROM companies) AS companies,
        (SELECT COUNT(*)::int FROM users) AS users,
        (SELECT COUNT(*)::int FROM users WHERE role = 'company_admin') AS company_admins,
        (SELECT COUNT(*)::int FROM users WHERE role = 'event_staff') AS event_staff,
        (SELECT COUNT(*)::int FROM events) AS events,
        (SELECT COUNT(*)::int FROM events WHERE status = 'published') AS published_events,
        (SELECT COUNT(*)::int FROM payments WHERE status = 'awaiting_approval') AS pending_payments,
        (SELECT COUNT(*)::int FROM users WHERE is_locked = true) AS locked_users,
        (SELECT COUNT(*)::int FROM events WHERE is_locked = true) AS locked_events,
        (SELECT COALESCE(SUM(quantity_sold),0)::int FROM ticket_types) AS tickets_sold,
        (SELECT COALESCE(SUM(total_amount_etb),0)::numeric FROM orders WHERE status = 'paid') AS revenue_etb
    `);
    res.json({
      overview: {
        ...rows[0],
        revenue_etb: Number(rows[0].revenue_etb),
      },
    });
  })
);

// GET /api/admin/companies
router.get(
  "/companies",
  asyncHandler(async (_req, res) => {
    const { rows } = await query(`
      SELECT c.id, c.name, c.slug, c.contact_email, c.contact_phone, c.logo_url, c.created_at,
             COUNT(DISTINCT e.id)::int AS event_count,
             COUNT(DISTINCT u.id)::int AS user_count
      FROM companies c
      LEFT JOIN events e ON e.company_id = c.id
      LEFT JOIN users u ON u.company_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    res.json({ companies: rows });
  })
);

// POST /api/admin/companies — create company + first company_admin
router.post(
  "/companies",
  asyncHandler(async (req, res) => {
    const {
      company_name,
      slug,
      contact_email,
      contact_phone,
      admin_name,
      admin_email,
      password,
    } = req.body || {};

    if (!company_name || !slug || !contact_email || !admin_name || !admin_email || !password) {
      throw new ApiError(400, "Missing required fields");
    }
    if (password.length < 8) throw new ApiError(400, "Password must be at least 8 characters");

    const result = await withTransaction(async (client) => {
      const existing = await client.query(
        `SELECT 1 FROM companies WHERE slug = $1 UNION SELECT 1 FROM users WHERE email = $2`,
        [slug, admin_email.toLowerCase()]
      );
      if (existing.rows.length) throw new ApiError(409, "Slug or admin email already in use");

      const company = await client.query(
        `INSERT INTO companies (name, slug, contact_email, contact_phone)
         VALUES ($1,$2,$3,$4) RETURNING *`,
        [company_name, slug, contact_email, contact_phone || null]
      );
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await client.query(
        `INSERT INTO users (company_id, full_name, email, password_hash, role)
         VALUES ($1,$2,$3,$4,'company_admin')
         RETURNING id, company_id, full_name, email, role, assigned_event_id, created_at`,
        [company.rows[0].id, admin_name, admin_email.toLowerCase(), passwordHash]
      );
      return { company: company.rows[0], user: user.rows[0] };
    });

    res.status(201).json(result);
  })
);

// GET /api/admin/users
router.get(
  "/users",
  asyncHandler(async (_req, res) => {
    const { rows } = await query(`
      SELECT u.id, u.full_name, u.email, u.role, u.company_id, u.assigned_event_id,
             u.is_locked, u.created_at,
             c.name AS company_name,
             e.title AS assigned_event_title
      FROM users u
      LEFT JOIN companies c ON c.id = u.company_id
      LEFT JOIN events e ON e.id = u.assigned_event_id
      ORDER BY
        CASE u.role
          WHEN 'super_admin' THEN 0
          WHEN 'company_admin' THEN 1
          ELSE 2
        END,
        u.created_at DESC
    `);
    res.json({ users: rows });
  })
);

// PATCH /api/admin/users/:id/lock — lock or unlock a user
router.patch(
  "/users/:id/lock",
  asyncHandler(async (req, res) => {
    const locked = Boolean(req.body && req.body.locked);
    const targetId = req.params.id;

    if (targetId === req.user.id) {
      throw new ApiError(400, "You cannot lock your own account");
    }

    const existing = await query(
      `SELECT id, role, is_locked FROM users WHERE id = $1`,
      [targetId]
    );
    if (!existing.rows.length) throw new ApiError(404, "User not found");
    if (existing.rows[0].role === "super_admin") {
      throw new ApiError(403, "Cannot lock a system owner account");
    }

    const { rows } = await query(
      `UPDATE users SET is_locked = $1
       WHERE id = $2
       RETURNING id, company_id, full_name, email, role, assigned_event_id, is_locked, created_at`,
      [locked, targetId]
    );
    res.json({ user: rows[0] });
  })
);

// POST /api/admin/users — create a company_admin for an existing company
router.post(
  "/users",
  asyncHandler(async (req, res) => {
    const { company_id, full_name, email, password } = req.body || {};

    if (!company_id || !full_name || !email || !password) {
      throw new ApiError(400, "company_id, full_name, email, and password are required");
    }
    if (password.length < 8) throw new ApiError(400, "Password must be at least 8 characters");

    const company = await query(`SELECT id FROM companies WHERE id = $1`, [company_id]);
    if (!company.rows.length) throw new ApiError(404, "Company not found");

    const existing = await query(`SELECT 1 FROM users WHERE email = $1`, [email.toLowerCase()]);
    if (existing.rows.length) throw new ApiError(409, "Email already in use");

    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `INSERT INTO users (company_id, full_name, email, password_hash, role)
       VALUES ($1,$2,$3,$4,'company_admin')
       RETURNING id, company_id, full_name, email, role, assigned_event_id, created_at`,
      [company_id, full_name, email.toLowerCase(), passwordHash]
    );

    res.status(201).json({ user: rows[0] });
  })
);

// GET /api/admin/events — all events across companies (with sales + revenue)
router.get(
  "/events",
  asyncHandler(async (_req, res) => {
    const { rows } = await query(`
      SELECT e.id, e.title, e.venue, e.city, e.event_start, e.event_end,
             e.status, e.is_locked, e.cover_image_url, e.company_id, e.created_at,
             c.name AS company_name,
             COALESCE(tt.tickets_sold, 0)::int AS tickets_sold,
             COALESCE(tt.capacity, 0)::int AS capacity,
             COALESCE(rev.revenue_etb, 0)::numeric AS revenue_etb
      FROM events e
      JOIN companies c ON c.id = e.company_id
      LEFT JOIN (
        SELECT event_id,
               SUM(quantity_sold)::int AS tickets_sold,
               SUM(quantity_total)::int AS capacity
        FROM ticket_types
        GROUP BY event_id
      ) tt ON tt.event_id = e.id
      LEFT JOIN (
        SELECT event_id, SUM(total_amount_etb)::numeric AS revenue_etb
        FROM orders
        WHERE status = 'paid'
        GROUP BY event_id
      ) rev ON rev.event_id = e.id
      ORDER BY e.event_start DESC
    `);
    res.json({
      events: rows.map((r) => ({
        ...r,
        revenue_etb: Number(r.revenue_etb),
      })),
    });
  })
);

// PATCH /api/admin/events/:id/lock — lock or unlock any event
router.patch(
  "/events/:id/lock",
  asyncHandler(async (req, res) => {
    const locked = Boolean(req.body && req.body.locked);

    const existing = await query(`SELECT id FROM events WHERE id = $1`, [req.params.id]);
    if (!existing.rows.length) throw new ApiError(404, "Event not found");

    const { rows } = await query(
      `UPDATE events SET is_locked = $1
       WHERE id = $2
       RETURNING *`,
      [locked, req.params.id]
    );
    res.json({ event: rows[0] });
  })
);

module.exports = router;
