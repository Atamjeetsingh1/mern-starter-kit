/**
 * controllers/emailVerification.controller.js
 * Controller for email verification flow.
 */

const emailVerificationService = require("../services/emailVerification.service");
const { sendSuccess } = require("../utils/apiResponse");
const { HTTP_STATUS, MESSAGES } = require("../constants");

/**
 * GET /api/v1/auth/verify-email?token=<64-char-hex>
 * Public - called when the user clicks the link in their email.
 */
const verifyEmail = async (req, res) => {
  const { token } = req.query;
  
  await emailVerificationService.verifyByToken(token);

  return sendSuccess(res, HTTP_STATUS.OK, "Email verified successfully. You can now log in.");
};

/**
 * POST /api/v1/auth/resend-verification
 * Public/Protected - resend the verification email
 */
const resendVerification = async (req, res) => {
  // If user is authenticated, use their email from req.user
  // If not, use req.body.email
  const email = req.user ? req.user.email : req.body.email;

  if (!email) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Email is required.",
    });
  }

  await emailVerificationService.resendVerification(email);

  return sendSuccess(
    res,
    HTTP_STATUS.OK,
    "If your account is registered and unverified, a new verification email has been sent."
  );
};

/**
 * POST /api/v1/auth/verify-otp
 * Protected - called by a mobile app / frontend using the 6-digit OTP
 */
const verifyOTP = async (req, res) => {
  const { otp } = req.body;
  const userId = req.user.id;

  await emailVerificationService.verifyByOTP(userId, otp);

  return sendSuccess(res, HTTP_STATUS.OK, "Email verified successfully.");
};

/**
 * GET /api/v1/auth/verification-status
 * Protected - check if the user is verified
 */
const getVerificationStatus = async (req, res) => {
  return sendSuccess(res, HTTP_STATUS.OK, "Status fetched successfully", {
    isEmailVerified: req.user.isEmailVerified || false,
  });
};

module.exports = {
  verifyEmail,
  resendVerification,
  verifyOTP,
  getVerificationStatus,
};
