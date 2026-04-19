/**
 * routes/auth.routes.js
 * All /api/v1/auth/* endpoints.
 *
 * Password reset flow:
 *   POST /forgot-password          → sends email with reset link
 *   PUT  /reset-password/:token    → consumes token, updates password
 *
 * Email verification flow:
 *   GET  /verify-email?token=XYZ   → verify via link (from email)
 *   POST /verify-otp               → verify via OTP code (protected)
 *   POST /resend-verification      → resend the email (rate-limited)
 *   GET  /verification-status      → check status (protected)
 */

const { Router } = require("express");
const authController                = require("../controllers/auth.controller");
const socialAuthController          = require("../controllers/auth.social.controller");
const passwordController            = require("../controllers/password.controller");
const emailVerificationController   = require("../controllers/emailVerification.controller");
const { protect }                   = require("../middleware/auth.middleware");
const rateLimit                     = require("express-rate-limit");
const {
  validateRegister,
  validateLogin,
  validateRefreshToken,
} = require("../validations/auth.validation");
const {
  validateForgotPassword,
  validateResetPassword,
  validateTokenParam,
} = require("../validations/password.validation");
const {
  validateVerifyToken,
  validateVerifyOTP,
  validateResendVerification,
} = require("../validations/emailVerification.validation");

const router = Router();

// ── Resend rate limiter: max 3 resends per 15 minutes per IP ──────────────
// Using express-rate-limit (no Redis needed) for simplicity and reliability.
// This is intentionally stricter than the global rate limiter.
const resendLimiter = rateLimit({
  windowMs:       15 * 60 * 1000,   // 15 minutes
  max:            3,
  standardHeaders: true,
  legacyHeaders:  false,
  message: {
    success: false,
    message: "Too many resend requests. Please wait 15 minutes before trying again.",
  },
  // Scope rate limit by IP so different users aren't blocked by each other
});

// ── Public: standard auth ──────────────────────────────────────────────────
router.post("/register", validateRegister,     authController.register);
router.post("/login",    validateLogin,         authController.login);
router.post("/refresh",  validateRefreshToken,  authController.refreshToken);

// ── Public: social login ────────────────────────────────────────────────────
// POST /auth/social-login  { idToken: string, provider: "google"|"facebook"|"apple" }
router.post("/social-login", socialAuthController.socialLogin);

// ── Public: password reset flow ────────────────────────────────────────────
router.post("/forgot-password",
  validateForgotPassword,
  passwordController.forgotPassword
);
router.put("/reset-password/:token",
  validateTokenParam,
  validateResetPassword,
  passwordController.resetPassword
);

// ── Public: email verification via link ───────────────────────────────────
// GET  /verify-email?token=<64-char-hex>
// Called when the user clicks the link in the verification email.
router.get("/verify-email",
  validateVerifyToken,
  emailVerificationController.verifyEmail
);

// ── Public (rate-limited): resend verification email ─────────────────────
// POST /resend-verification
// Works both authenticated (body optional) and unauthenticated (body.email required).
router.post("/resend-verification",
  resendLimiter,
  validateResendVerification,
  emailVerificationController.resendVerification
);

// ── Protected: OTP-based verification ────────────────────────────────────
// POST /verify-otp  { otp: "123456" }
// Alternative to clicking the link — for mobile apps.
router.post("/verify-otp",
  protect,
  validateVerifyOTP,
  emailVerificationController.verifyOTP
);

// ── Protected: check verification status ─────────────────────────────────
// GET /verification-status
// Frontend uses this to decide whether to show the "verify email" banner.
router.get("/verification-status",
  protect,
  emailVerificationController.getVerificationStatus
);

// ── Protected: standard ───────────────────────────────────────────────────
router.post("/logout", protect, authController.logout);
router.get("/me",      protect, authController.getMe);

module.exports = router;