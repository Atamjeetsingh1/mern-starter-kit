/**
 * utils/AppError.js
 * Custom error class that carries an HTTP status code.
 * Throwing an AppError anywhere in the stack lets the global error
 * middleware return the exact status code without extra boilerplate.
 */

class AppError extends Error {
  /**
   * @param {string}  message     - Human-readable error message
   * @param {number}  statusCode  - HTTP status code (4xx / 5xx)
   * @param {*}       [errors]    - Optional structured error payload
   *                                (e.g. validation errors array)
   */
  constructor(message, statusCode, errors = null) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true; // Flag to distinguish expected vs unexpected errors

    // Preserve the correct stack trace in V8 environments
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;