const { ApiError } = require("../utils/ApiError");

/** Allows only the given roles. super_admin always passes. */
function roleGuard(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, "Authentication required"));
    if (req.user.role === "super_admin") return next();
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "Insufficient permissions"));
    }
    return next();
  };
}

module.exports = { roleGuard };
