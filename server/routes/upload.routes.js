/**
 * routes/upload.routes.js
 * All /api/v1/upload endpoints.
 */

const { Router } = require("express");
const { protect } = require("../middleware/auth.middleware");
const {
  uploadAvatar,
  uploadSingleFile,
  uploadMultipleFiles,
  deleteFile,
} = require("../controllers/upload.controller");
const {
  uploadSingle,
  uploadMultiple,
  cloudinaryUpload,
  UPLOAD_FOLDERS,
} = require("../middleware/upload");
const { ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES, ALLOWED_VIDEO_TYPES } = require("../constants/upload.constants");
const asyncHandler = require("../middleware/asyncHandler");

const router = Router();

// All upload routes require authentication
router.use(protect);

// ── /api/v1/upload/avatar ──────────────────────────────────────────────────
router.post(
  "/avatar",
  uploadSingle("avatar", { allowedTypes: ALLOWED_IMAGE_TYPES }),
  cloudinaryUpload({ folder: UPLOAD_FOLDERS.USERS }),
  asyncHandler(uploadAvatar)
);

// ── /api/v1/upload/single ──────────────────────────────────────────────────
router.post(
  "/single",
  uploadSingle("file"),
  cloudinaryUpload({ folder: UPLOAD_FOLDERS.GENERAL }),
  asyncHandler(uploadSingleFile)
);

// ── /api/v1/upload/multiple ────────────────────────────────────────────────
router.post(
  "/multiple",
  uploadMultiple("files"),
  cloudinaryUpload({ folder: UPLOAD_FOLDERS.GENERAL }),
  asyncHandler(uploadMultipleFiles)
);

// ── /api/v1/upload/:publicId ───────────────────────────────────────────────
router.delete("/:publicId", asyncHandler(deleteFile));

module.exports = router;
