const rateLimit = require("express-rate-limit");
const { env } = require("../config/env");

/** Prevents scan-spam abuse on the check-in endpoint. */
const checkInLimiter = rateLimit({
  windowMs: env.CHECKIN_RATE_WINDOW_MS,
  max: env.CHECKIN_RATE_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many scans, slow down." },
});

module.exports = { checkInLimiter };
