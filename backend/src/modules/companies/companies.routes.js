const express = require("express");
const { query } = require("../../config/db");
const asyncHandler = require("../../utils/asyncHandler");
const { ApiError } = require("../../utils/ApiError");
const { authRequired } = require("../../middleware/auth");
const { roleGuard } = require("../../middleware/roleGuard");

const router = express.Router();

// GET /api/companies/:id/events  (admins of that company, or super_admin)
router.get(
  "/:id/events",
  authRequired,
  roleGuard("company_admin"),
  asyncHandler(async (req, res) => {
    if (req.user.role !== "super_admin" && req.user.company_id !== req.params.id) {
      throw new ApiError(403, "Cannot access another company's events");
    }
    const { rows } = await query(
      `SELECT e.*,
              COALESCE(SUM(tt.quantity_sold),0)::int AS tickets_sold,
              COALESCE(SUM(tt.quantity_total),0)::int AS tickets_total
       FROM events e
       LEFT JOIN ticket_types tt ON tt.event_id = e.id
       WHERE e.company_id = $1
       GROUP BY e.id
       ORDER BY e.created_at DESC`,
      [req.params.id]
    );
    res.json({ events: rows });
  })
);

// GET /api/companies/:id
router.get(
  "/:id",
  authRequired,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT id, name, slug, contact_email, contact_phone, logo_url, created_at
       FROM companies WHERE id = $1`,
      [req.params.id]
    );
    if (!rows.length) throw new ApiError(404, "Company not found");
    res.json({ company: rows[0] });
  })
);

module.exports = router;
