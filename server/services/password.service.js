/**
 * services/password.service.js
 * Business logic for the forgot-password / reset-password flow.
 *
 * Security design:
 *  1. forgotPassword()
 *     - Generate cryptographically secure random token (crypto.randomBytes)
 *     - Hash it with SHA-256 → store ONLY the hash in DB
 *     - Embed the PLAIN token in the reset URL (never stored)
 *     - Send email; if email fails, clear token so user can retry
 *
 *  2. resetPassword()
 *     - Re-hash the token from the URL param
 *     - Look up user: matching hash + expiry > now
 *     - Update password (pre-save hook bcrypts it automatically)
 *     - Clear token fields + invalidate all refresh tokens (force re-login)
 */

const crypto   = require("crypto");
const User     = require("../models/User");
const { sendPasswordResetEmail } = require("../utils/email.utils.js");
const AppError = require("../utils/AppError");
const { HTTP_STATUS } = require("../constants");

const RESET_EXPIRES_MIN = 15;

// SHA-256 hash of a plain token string
const hashToken = (plain) =>
  crypto.createHash("sha256").update(plain).digest("hex");

// ─────────────────────────────────────────────────────────────────────────────
// forgotPassword
// ─────────────────────────────────────────────────────────────────────────────
const forgotPassword = async (email, clientUrl) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  // Silent return — prevents email enumeration (caller always sends HTTP 200)
  if (!user || !user.isActive) return;

  // 1. Generate a 32-byte random token
  const plainToken = crypto.randomBytes(32).toString("hex");

  // 2. Store the SHA-256 hash — never store the plain token in the DB
  user.resetPasswordToken  = hashToken(plainToken);
  user.resetPasswordExpire = new Date(Date.now() + RESET_EXPIRES_MIN * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  // 3. Build the link — plain token goes only in the email
  //    Route: PUT /api/v1/auth/reset-password/:token
  const resetUrl = `${clientUrl}/reset-password/${plainToken}`;

  try {
    await sendPasswordResetEmail(email, resetUrl);
  } catch {
    // Sending failed → wipe the token so the user can request again
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    throw new AppError(
      "Failed to send the reset email. Please try again later.",
      HTTP_STATUS.INTERNAL_ERROR
    );
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// resetPassword
// ─────────────────────────────────────────────────────────────────────────────
const resetPassword = async (plainToken, newPassword) => {
  // 1. Re-hash the URL token to compare with the stored hash
  const hashed = hashToken(plainToken);

  // 2. Find user: hash matches AND token has not expired
  const user = await User.findOne({
    resetPasswordToken:  hashed,
    resetPasswordExpire: { $gt: Date.now() },
  }).select("+resetPasswordToken +resetPasswordExpire");

  if (!user) {
    throw new AppError(
      "Password reset link is invalid or has expired. Please request a new one.",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // 3. Set new password — the pre-save hook bcrypts it automatically
  user.password            = newPassword;

  // 4. Clear reset token fields so the link cannot be reused
  user.resetPasswordToken  = undefined;
  user.resetPasswordExpire = undefined;

  // 5. Invalidate all active sessions
  user.refreshToken = undefined;

  await user.save();
};

module.exports = { forgotPassword, resetPassword };