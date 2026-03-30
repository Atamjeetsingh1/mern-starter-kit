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
const { protect } = require("../middleware/auth.middleware");
const {
  validateRegister,
  validateLogin,
  validateRefreshToken,
} = require("../validations/auth.validation");
const asyncHandler = require("../middleware/asyncHandler");

const router = Router();

// ── Public routes ──────────────────────────────────────────────────────────
router.post("/register", validateRegister, asyncHandler(register));
router.post("/login", validateLogin, asyncHandler(login));
router.post("/refresh-token", validateRefreshToken, asyncHandler(refreshToken));

// ── Protected routes ───────────────────────────────────────────────────────
router.post("/logout", protect, asyncHandler(logout));
router.get("/me", protect, asyncHandler(getMe));

module.exports = router;