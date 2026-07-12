const express = require("express");
const { query } = require("../../config/db");
const asyncHandler = require("../../utils/asyncHandler");
const { ApiError } = require("../../utils/ApiError");
const { authRequired } = require("../../middleware/auth");
const { roleGuard } = require("../../middleware/roleGuard");

// mounted at /api/events/:id/check-ins
const router = express.Router({ mergeParams: true });

// GET /api/events/:id/check-ins   (audit log / live check-in feed)
router.get(
  "/",
  authRequired,
  roleGuard("company_admin", "event_staff"),
  asyncHandler(async (req, res) => {
    const eventId = req.params.id;

    const ev = await query(`SELECT company_id FROM events WHERE id = $1`, [eventId]);
    if (!ev.rows.length) throw new ApiError(404, "Event not found");
    if (req.user.role === "company_admin" && ev.rows[0].company_id !== req.user.company_id) {
      throw new ApiError(403, "Not your event");
    }
    if (req.user.role === "event_staff" && req.user.assigned_event_id !== eventId) {
      throw new ApiError(403, "Staff not assigned to this event");
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const { rows } = await query(
      `SELECT c.id, c.result, c.scanned_at,
              t.ticket_code, t.holder_name,
              u.full_name AS scanned_by_name
       FROM check_ins c
       JOIN tickets t ON t.id = c.ticket_id
       LEFT JOIN users u ON u.id = c.scanned_by
       WHERE t.event_id = $1
       ORDER BY c.scanned_at DESC
       LIMIT $2`,
      [eventId, limit]
    );
    res.json({ check_ins: rows });
  })
);

module.exports = router;
