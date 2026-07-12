const express = require("express");
const bcrypt = require("bcryptjs");
const { query, withTransaction } = require("../../config/db");
const asyncHandler = require("../../utils/asyncHandler");
const { ApiError } = require("../../utils/ApiError");
const { signToken, authRequired } = require("../../middleware/auth");

const router = express.Router();

// POST /api/auth/register-company
// Creates a company + its first company_admin user in one transaction.
router.post(
  "/register-company",
  asyncHandler(async (req, res) => {
    const { company_name, slug, contact_email, contact_phone, admin_name, admin_email, password } =
      req.body || {};

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
         RETURNING id, company_id, full_name, email, role, assigned_event_id`,
        [company.rows[0].id, admin_name, admin_email.toLowerCase(), passwordHash]
      );
      return { company: company.rows[0], user: user.rows[0] };
    });

    const token = signToken(result.user);
    res.status(201).json({ token, user: result.user, company: result.company });
  })
);

// POST /api/auth/login
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) throw new ApiError(400, "Email and password required");

    const { rows } = await query(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase()]);
    const user = rows[0];
    if (!user) throw new ApiError(401, "Invalid credentials");

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new ApiError(401, "Invalid credentials");

    const safeUser = {
      id: user.id,
      company_id: user.company_id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      assigned_event_id: user.assigned_event_id,
    };
    res.json({ token: signToken(safeUser), user: safeUser });
  })
);

// GET /api/auth/me
router.get(
  "/me",
  authRequired,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT id, company_id, full_name, email, role, assigned_event_id FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!rows.length) throw new ApiError(404, "User not found");
    res.json({ user: rows[0] });
  })
);

module.exports = router;
