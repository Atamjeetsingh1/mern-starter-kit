/**
 * routes/auth.routes.js
 * All /api/v1/auth endpoints.
 */

const { Router } = require("express");
const {
  register,
  login,
  refreshToken,
  logout,
  getMe,
} = require("../controllers/auth.controller");
const passwordController = require("../controllers/password.controller");
const { protect } = require("../middleware/auth.middleware");
const {
  validateRegister,
  validateLogin,
  validateRefreshToken,
} = require("../validations/auth.validation");
const asyncHandler = require("../middleware/asyncHandler");

const {
  validateForgotPassword,
  validateResetPassword,
  validateTokenParam,
} = require("../validations/password.validation");

const router = Router();

// ── Public routes ──────────────────────────────────────────────────────────
router.post("/register", validateRegister, asyncHandler(register));
router.post("/login", validateLogin, asyncHandler(login));
router.post("/refresh-token", validateRefreshToken, asyncHandler(refreshToken));

// ── Public: password reset flow ────────────────────────────────────────────
// Step 1: user submits email → receive reset email
router.post(
  "/forgot-password",
  validateForgotPassword,
  passwordController.forgotPassword
);

// Step 2: user clicks link → PUT with :token param + new password in body
router.put(
  "/reset-password/:token",
  validateTokenParam,         // validate :token format before touching DB
  validateResetPassword,      // validate body { password, confirmPassword }
  passwordController.resetPassword
);

// ── Protected routes ───────────────────────────────────────────────────────
router.post("/logout", protect, asyncHandler(logout));
router.get("/me", protect, asyncHandler(getMe));

module.exports = router;