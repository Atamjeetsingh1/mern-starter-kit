/**
 * middleware/auth.middleware.js
 * Verifies the Bearer access token on protected routes.
 * Attaches { id, role } to req.user on success.
 */

const { verifyAccessToken } = require("../utils/token.utils");
const AppError = require("../utils/AppError");
const { HTTP_STATUS, MESSAGES } = require("../constants");
const asyncHandler = require("./asyncHandler");

/**
 * protect — require a valid access token.
 * Attach decoded payload to req.user.
 */
const protect = asyncHandler(async (req, _res, next) => {
  // 1. Extract token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError(MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw new AppError(MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
  }

  // 2. Verify token
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    // jwt.TokenExpiredError or jwt.JsonWebTokenError
    throw new AppError(MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED);
  }

  // 3. Attach to request
  req.user = { id: decoded.id, role: decoded.role };
  next();
});

module.exports = { protect };