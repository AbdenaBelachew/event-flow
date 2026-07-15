const express = require("express");
const bcrypt = require("bcryptjs");
const { query } = require("../../config/db");
const asyncHandler = require("../../utils/asyncHandler");
const { ApiError } = require("../../utils/ApiError");
const { authRequired } = require("../../middleware/auth");
const { roleGuard } = require("../../middleware/roleGuard");

// mergeParams so /events/:eventId/staff can read eventId
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

// GET /api/events/:eventId/staff
router.get(
  "/",
  authRequired,
  roleGuard("company_admin"),
  asyncHandler(async (req, res) => {
    const event = await loadEventOwned(req, req.params.eventId);
    const { rows } = await query(
      `SELECT id, full_name, email, role, assigned_event_id, created_at
       FROM users
       WHERE role = 'event_staff'
         AND assigned_event_id = $1
         AND company_id = $2
       ORDER BY created_at ASC`,
      [event.id, event.company_id]
    );
    res.json({ staff: rows });
  })
);

// POST /api/events/:eventId/staff
// Creates a door-check user scoped to this event only.
router.post(
  "/",
  authRequired,
  roleGuard("company_admin"),
  asyncHandler(async (req, res) => {
    const event = await loadEventOwned(req, req.params.eventId);
    assertEventWritable(req, event);
    const { full_name, email, password } = req.body || {};

    if (!full_name || !email || !password) {
      throw new ApiError(400, "full_name, email, and password are required");
    }
    if (String(password).length < 8) {
      throw new ApiError(400, "Password must be at least 8 characters");
    }

    const emailNorm = String(email).trim().toLowerCase();
    const existing = await query(`SELECT id FROM users WHERE email = $1`, [emailNorm]);
    if (existing.rows.length) {
      throw new ApiError(409, "Email already in use");
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const { rows } = await query(
      `INSERT INTO users (company_id, full_name, email, password_hash, role, assigned_event_id)
       VALUES ($1, $2, $3, $4, 'event_staff', $5)
       RETURNING id, company_id, full_name, email, role, assigned_event_id, created_at`,
      [event.company_id, String(full_name).trim(), emailNorm, passwordHash, event.id]
    );

    res.status(201).json({ staff: rows[0] });
  })
);

// DELETE /api/events/:eventId/staff/:userId
router.delete(
  "/:userId",
  authRequired,
  roleGuard("company_admin"),
  asyncHandler(async (req, res) => {
    const event = await loadEventOwned(req, req.params.eventId);
    assertEventWritable(req, event);
    const { rows } = await query(
      `DELETE FROM users
       WHERE id = $1
         AND role = 'event_staff'
         AND assigned_event_id = $2
         AND company_id = $3
       RETURNING id`,
      [req.params.userId, event.id, event.company_id]
    );
    if (!rows.length) throw new ApiError(404, "Door staff not found");
    res.json({ ok: true });
  })
);

module.exports = router;
