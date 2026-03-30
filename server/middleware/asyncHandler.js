/**
 * middleware/asyncHandler.js
 * Wraps async route handlers so you never write try/catch in controllers.
 * Any thrown error is forwarded to Express's global error middleware.
 *
 * Usage:
 *   router.get("/route", asyncHandler(async (req, res) => { ... }));
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;