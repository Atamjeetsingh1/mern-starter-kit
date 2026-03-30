/**
 * routes/user.routes.js
 * All /api/v1/users endpoints.
 */

const { Router } = require("express");
const {
  getAllUsers,
  getUserById,
  getMyProfile,
  updateUser,
  deleteUser,
} = require("../controllers/user.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorise } = require("../middleware/role.middleware");
const asyncHandler = require("../middleware/asyncHandler");

const router = Router();

// All user routes require authentication
router.use(protect);

// ── /api/v1/users/profile ──────────────────────────────────────────────────
router.get("/profile", asyncHandler(getMyProfile));

// ── /api/v1/users ─────────────────────────────────────────────────────────
router
  .route("/")
  .get(authorise("admin", "provider"), asyncHandler(getAllUsers));

// ── /api/v1/users/:id ─────────────────────────────────────────────────────
router
  .route("/:id")
  .get(asyncHandler(getUserById))
  .patch(asyncHandler(updateUser))
  .delete(authorise("admin"), asyncHandler(deleteUser));

module.exports = router;