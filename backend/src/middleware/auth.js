const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const { query } = require("../config/db");
const { ApiError } = require("../utils/ApiError");

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      company_id: user.company_id,
      assigned_event_id: user.assigned_event_id || null,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

function attachUserFromToken(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  const payload = jwt.verify(token, env.JWT_SECRET);
  return {
    id: payload.sub,
    role: payload.role,
    company_id: payload.company_id,
    assigned_event_id: payload.assigned_event_id,
  };
}

/** Requires a valid Bearer token; rejects locked accounts; attaches req.user. */
async function authRequired(req, _res, next) {
  try {
    const user = attachUserFromToken(req);
    if (!user) return next(new ApiError(401, "Authentication required"));

    const { rows } = await query(
      `SELECT is_locked FROM users WHERE id = $1`,
      [user.id]
    );
    if (!rows.length) return next(new ApiError(401, "Authentication required"));
    if (rows[0].is_locked) {
      return next(new ApiError(403, "Account is locked. Contact the platform owner."));
    }

    req.user = user;
    return next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    return next(new ApiError(401, "Invalid or expired token"));
  }
}

/** Parses Bearer token when present; continues anonymously otherwise. */
async function authOptional(req, _res, next) {
  try {
    const user = attachUserFromToken(req);
    if (user) {
      const { rows } = await query(
        `SELECT is_locked FROM users WHERE id = $1`,
        [user.id]
      );
      if (rows.length && !rows[0].is_locked) {
        req.user = user;
      }
    }
  } catch (_err) {
    // Ignore invalid tokens for optional auth
  }
  return next();
}

module.exports = { signToken, authRequired, authOptional };
