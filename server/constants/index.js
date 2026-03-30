/**
 * constants/index.js
 * Single source of truth for magic strings, codes, and enums.
 * Avoids typos scattered across the codebase.
 */

// ── User roles ─────────────────────────────────────────────────────────────
const USER_ROLES = Object.freeze({
  CUSTOMER: "customer",
  PROVIDER: "provider",
  ADMIN: "admin", // Reserved for future use
});

// ── HTTP status codes (semantic aliases) ──────────────────────────────────
const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
});

// ── Standard API response messages ────────────────────────────────────────
const MESSAGES = Object.freeze({
  // Auth
  REGISTER_SUCCESS: "Account created successfully.",
  LOGIN_SUCCESS: "Login successful.",
  LOGOUT_SUCCESS: "Logged out successfully.",
  TOKEN_REFRESHED: "Token refreshed successfully.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  EMAIL_ALREADY_EXISTS: "An account with this email already exists.",
  UNAUTHORIZED: "Unauthorized. Please log in.",
  FORBIDDEN: "Access denied. Insufficient permissions.",
  INVALID_TOKEN: "Invalid or expired token.",
  // User
  USER_FETCHED: "User fetched successfully.",
  USERS_FETCHED: "Users fetched successfully.",
  USER_UPDATED: "User updated successfully.",
  USER_DELETED: "User deleted successfully.",
  USER_NOT_FOUND: "User not found.",
  // Generic
  SERVER_ERROR: "An internal server error occurred.",
  NOT_FOUND: "Resource not found.",
  VALIDATION_ERROR: "Validation failed.",
});

// ── Cookie names ───────────────────────────────────────────────────────────
const COOKIE_NAMES = Object.freeze({
  REFRESH_TOKEN: "refreshToken",
});

// ── Token types ────────────────────────────────────────────────────────────
const TOKEN_TYPES = Object.freeze({
  ACCESS: "access",
  REFRESH: "refresh",
});

module.exports = {
  USER_ROLES,
  HTTP_STATUS,
  MESSAGES,
  COOKIE_NAMES,
  TOKEN_TYPES,
};