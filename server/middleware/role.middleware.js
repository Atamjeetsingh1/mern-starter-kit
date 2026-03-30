/**
 * middleware/role.middleware.js
 * Role-Based Access Control (RBAC) middleware.
 * Must be used AFTER the `protect` middleware so that req.user is set.
 *
 * Usage:
 *   router.get("/admin", protect, authorise("admin"), handler);
 *   router.get("/dashboard", protect, authorise("customer", "provider"), handler);
 */

const AppError = require("../utils/AppError");
const { HTTP_STATUS, MESSAGES } = require("../constants");

/**
 * authorise — factory that returns a middleware allowing only the specified roles.
 * @param  {...string} roles  - Allowed role strings
 * @returns {import('express').RequestHandler}
 */
const authorise = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      // Should not happen if `protect` runs first, but guard anyway
      return next(new AppError(MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN));
    }

    next();
  };
};

module.exports = { authorise };