const { ApiError } = require("../utils/ApiError");

function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error("❌ Server Error:", {
      message: err.message,
      code: err.code,
      status,
      stack: err.stack,
    });
  }
  res.status(status).json({
    error: err.message || "Internal server error",
    ...(err.details ? { details: err.details } : {}),
  });
}

module.exports = { notFoundHandler, errorHandler };
