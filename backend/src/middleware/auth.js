const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
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

/** Requires a valid Bearer token; attaches req.user. */
function authRequired(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, "Authentication required"));
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = {
      id: payload.sub,
      role: payload.role,
      company_id: payload.company_id,
      assigned_event_id: payload.assigned_event_id,
    };
    return next();
  } catch (_err) {
    return next(new ApiError(401, "Invalid or expired token"));
  }
}

module.exports = { signToken, authRequired };
