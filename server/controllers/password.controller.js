/**
 * controllers/password.controller.js
 * Thin HTTP layer — delegates all logic to password.service.js
 *
 * Routes:
 *   POST /api/v1/auth/forgot-password
 *   PUT  /api/v1/auth/reset-password/:token
 */

const passwordService = require("../services/password.service");
const asyncHandler    = require("../middleware/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { HTTP_STATUS } = require("../constants");
const env             = require("../config/env");

/**
 * POST /api/v1/auth/forgot-password
 * Public. Accepts { email } in body.
 * Always returns 200 to prevent email enumeration — regardless of
 * whether the email exists in the database.
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Fire-and-forget: do NOT await — response time must not reveal user existence
  passwordService.forgotPassword(email, env.CLIENT_URL).catch(() => {});

  sendSuccess(
    res,
    HTTP_STATUS.OK,
    "If an account with that email exists, a password reset link has been sent."
  );
});

/**
 * PUT /api/v1/auth/reset-password/:token
 * Public. Token comes from the URL param, new password from body.
 * Steps (in service):
 *   1. SHA-256 hash the plain token from :token param
 *   2. Find user where resetPasswordToken === hash AND resetPasswordExpire > now
 *   3. bcrypt the new password (via pre-save hook), clear token fields
 *   4. Invalidate all refresh tokens (force re-login everywhere)
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token }    = req.params;       // Plain token from the email link
  const { password } = req.body;         // New password chosen by the user

  await passwordService.resetPassword(token, password);

  sendSuccess(
    res,
    HTTP_STATUS.OK,
    "Password has been reset successfully. You can now log in with your new password."
  );
});

module.exports = { forgotPassword, resetPassword };