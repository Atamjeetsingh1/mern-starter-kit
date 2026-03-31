/**
 * constants/upload.constants.js
 * Single source of truth for all file-upload configuration.
 * Tweak limits here — middleware picks them up automatically.
 */

// ── Cloudinary folder names ────────────────────────────────────────────────
const UPLOAD_FOLDERS = Object.freeze({
  USERS:      "users",
  POSTS:      "posts",
  PRODUCTS:   "products",
  DOCUMENTS:  "documents",
  TEMP:       "temp",
});

// ── Allowed MIME types per category ───────────────────────────────────────
const ALLOWED_IMAGE_TYPES = Object.freeze([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

const ALLOWED_VIDEO_TYPES = Object.freeze([
  "video/mp4",
  "video/mpeg",
  "video/quicktime",
  "video/x-msvideo",   // AVI
  "video/webm",
]);

const ALLOWED_DOCUMENT_TYPES = Object.freeze([
  "application/pdf",
  "application/msword",                                                         // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",   // .docx
  "application/vnd.ms-excel",                                                   // .xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",          // .xlsx
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
]);

// ── File size limits (in bytes) ────────────────────────────────────────────
const FILE_SIZE_LIMITS = Object.freeze({
  IMAGE:    5  * 1024 * 1024,   //  5 MB
  VIDEO:    100 * 1024 * 1024,  // 100 MB
  DOCUMENT: 10  * 1024 * 1024,  //  10 MB
  DEFAULT:  5  * 1024 * 1024,   //  5 MB
});

// ── Max file counts per request ────────────────────────────────────────────
const MAX_FILE_COUNT = Object.freeze({
  SINGLE:   1,
  MULTIPLE: 10,
});

// ── Cloudinary resource types ──────────────────────────────────────────────
const CLOUDINARY_RESOURCE_TYPES = Object.freeze({
  IMAGE:    "image",
  VIDEO:    "video",
  RAW:      "raw",   // documents, PDFs, etc.
  AUTO:     "auto",
});

// ── Human-readable file category map (used in error messages) ─────────────
const FILE_CATEGORIES = Object.freeze({
  IMAGE:    "image",
  VIDEO:    "video",
  DOCUMENT: "document",
});

module.exports = {
  UPLOAD_FOLDERS,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  FILE_SIZE_LIMITS,
  MAX_FILE_COUNT,
  CLOUDINARY_RESOURCE_TYPES,
  FILE_CATEGORIES,
};