/**
 * middleware/error.middleware.js
 * Centralised Express error handler.
 * Must be registered LAST in app.js (after all routes).
 *
 * Handles:
 *  - AppError (operational errors with known status codes)
 *  - Mongoose validation / cast / duplicate-key errors
 *  - JWT errors
 *  - Unknown/programming errors → 500
 */

const mongoose = require("mongoose");
const logger = require("../utils/logger");
const AppError = require("../utils/AppError");
const { HTTP_STATUS } = require("../constants");
const env = require("../config/env");

// ── Mongoose error normalizers ─────────────────────────────────────────────

/** Turn a Mongoose CastError (bad ObjectId etc.) into an AppError. */
const handleCastError = (err) =>
  new AppError(`Invalid value for field '${err.path}': ${err.value}`, 400);

/** Turn a Mongoose duplicate-key error into an AppError. */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(
    `Duplicate value for '${field}'. Please use a different value.`,
    HTTP_STATUS.CONFLICT
  );
};

/** Turn Mongoose ValidationError into an AppError with field-level detail. */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((e) => ({
    field: e.path,
    message: e.message,
  }));
  return new AppError("Validation failed.", HTTP_STATUS.UNPROCESSABLE, errors);
};

// ── JWT error normalizers ──────────────────────────────────────────────────
const handleJwtError = () =>
  new AppError("Invalid token. Please log in again.", HTTP_STATUS.UNAUTHORIZED);

const handleJwtExpiredError = () =>
  new AppError("Token expired. Please log in again.", HTTP_STATUS.UNAUTHORIZED);

// ── Main error handler ─────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, _next) => {
  // Default values
  let error = err;

  // ── Normalise known error types ──────────────────────────────────────────
  if (err instanceof mongoose.Error.CastError) error = handleCastError(err);
  else if (err.code === 11000) error = handleDuplicateKeyError(err);
  else if (err instanceof mongoose.Error.ValidationError) error = handleValidationError(err);
  else if (err.name === "JsonWebTokenError") error = handleJwtError();
  else if (err.name === "TokenExpiredError") error = handleJwtExpiredError();

  // ── Determine status code ────────────────────────────────────────────────
  const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_ERROR;
  const message = error.message || "Something went wrong.";

  // ── Log ──────────────────────────────────────────────────────────────────
  if (statusCode >= 500) {
    // Log unexpected server errors with full stack trace
    logger.error(`[${req.method}] ${req.originalUrl} — ${message}`, {
      statusCode,
      stack: err.stack,
    });
  } else if (env.isDev) {
    logger.warn(`[${req.method}] ${req.originalUrl} — ${statusCode}: ${message}`);
  }

  // ── Build response ───────────────────────────────────────────────────────
  const body = {
    success: false,
    message,
    ...(error.errors && { errors: error.errors }),
    // Only include stack trace in development
    ...(env.isDev && { stack: err.stack }),
  };

  res.status(statusCode).json(body);
};

module.exports = errorMiddleware;