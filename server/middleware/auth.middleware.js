/**
 * middleware/auth.middleware.js
 * Verifies the Bearer access token on protected routes.
 * Attaches { id, role } to req.user on success.
 *
 * Supports two auth methods:
 *  1. Authorization: Bearer <token> header (standard)
 *  2. httpOnly cookie named "refreshToken" (for social login session persistence)
 */

const { verifyAccessToken } = require("../utils/token.utils");
const AppError = require("../utils/AppError");
const { HTTP_STATUS, MESSAGES, COOKIE_NAMES } = require("../constants");
const asyncHandler = require("./asyncHandler");

/**
 * protect — require a valid access token.
 * Attach decoded payload to req.user.
 */
const protect = asyncHandler(async (req, _res, next) => {
  let token = null;

  // 1. Try to get token from Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  // 2. Fallback: check httpOnly cookie (for social login session persistence)
  if (!token && req.cookies && req.cookies[COOKIE_NAMES.REFRESH_TOKEN]) {
    token = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];
  }

  if (!token) {
    throw new AppError(MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
  }

  // 3. Verify token
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    // jwt.TokenExpiredError or jwt.JsonWebTokenError
    throw new AppError(MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED);
  }

  // 4. Attach to request
  req.user = { id: decoded.id, role: decoded.role };
  next();
});

module.exports = { protect };