/**
 * middleware/upload/index.js
 * Barrel export — import everything from one place:
 *
 *   const {
 *     uploadSingle, uploadMultiple, uploadFields,
 *     cloudinaryUpload, cloudinaryUploadMultiple,
 *     imageUpload, videoUpload, documentUpload,
 *     UPLOAD_FOLDERS,
 *   } = require("../middleware/upload");
 */

const {
  createUpload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  imageUpload,
  videoUpload,
  documentUpload,
  anyUpload,
  wrapMulter,
} = require("./multer.middleware");

const {
  cloudinaryUpload,
  cloudinaryUploadMultiple,
  cloudinaryUploadFields,
  streamToCloudinary,
} = require("./cloudinary.middleware");

const { UPLOAD_FOLDERS } = require("../../constants/upload.constants");

module.exports = {
  // ── Multer (parse + validate) ──────────────────────────────────────────
  createUpload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  imageUpload,
  videoUpload,
  documentUpload,
  anyUpload,
  wrapMulter,

  // ── Cloudinary (stream to cloud) ───────────────────────────────────────
  cloudinaryUpload,
  cloudinaryUploadMultiple,
  cloudinaryUploadFields,
  streamToCloudinary,

  // ── Constants ──────────────────────────────────────────────────────────
  UPLOAD_FOLDERS,
};