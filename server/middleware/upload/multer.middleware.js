/**
 * middleware/upload/multer.middleware.js
 * ──────────────────────────────────────
 * Factory functions that return configured multer instances.
 * Files are stored in memory (Buffer) then streamed to Cloudinary.
 * Nothing is ever written to the server's local disk.
 *
 * Exports:
 *   createUpload(options)   → multer instance (use .single / .array / .fields on it)
 *   uploadSingle(field, options)   → ready-to-use middleware for one file
 *   uploadMultiple(field, options) → ready-to-use middleware for many files
 *   uploadFields(fields, options)  → ready-to-use middleware for mixed fields
 */

const multer = require("multer");
const AppError = require("../../utils/AppError");
const {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  FILE_SIZE_LIMITS,
  MAX_FILE_COUNT,
} = require("../../constants/upload.constants");

// ── All accepted types across all categories ───────────────────────────────
const ALL_ALLOWED_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
];

// ── MIME → category mapping (used in error messages) ──────────────────────
const mimeToCategory = (mime) => {
  if (ALLOWED_IMAGE_TYPES.includes(mime)) return "image";
  if (ALLOWED_VIDEO_TYPES.includes(mime)) return "video";
  if (ALLOWED_DOCUMENT_TYPES.includes(mime)) return "document";
  return "file";
};

/**
 * Build a multer file filter that accepts only the specified MIME types.
 * @param {string[]} allowedTypes  Array of MIME strings; defaults to all allowed.
 */
const buildFileFilter = (allowedTypes = ALL_ALLOWED_TYPES) => {
  return (_req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      return cb(null, true); // Accept
    }

    const category = mimeToCategory(file.mimetype);
    cb(
      new AppError(
        `File type "${file.mimetype}" is not allowed. ` +
        `Accepted ${category} types: ${allowedTypes.join(", ")}`,
        400
      ),
      false // Reject
    );
  };
};

/**
 * createUpload — core factory.
 *
 * @param {{
 *   allowedTypes?: string[],
 *   maxSizeBytes?: number,
 * }} options
 * @returns {multer.Multer}
 */
const createUpload = ({
  allowedTypes = ALL_ALLOWED_TYPES,
  maxSizeBytes = FILE_SIZE_LIMITS.DEFAULT,
} = {}) => {
  return multer({
    // In-memory storage: files arrive as req.file.buffer / req.files[n].buffer
    storage: multer.memoryStorage(),

    limits: {
      fileSize: maxSizeBytes,
      files: MAX_FILE_COUNT.MULTIPLE, // hard cap — override per-route with .array(field, n)
    },

    fileFilter: buildFileFilter(allowedTypes),
  });
};

// ── Convenience pre-built instances ───────────────────────────────────────

/** Images only, 5 MB max */
const imageUpload = createUpload({
  allowedTypes: ALLOWED_IMAGE_TYPES,
  maxSizeBytes: FILE_SIZE_LIMITS.IMAGE,
});

/** Videos only, 100 MB max */
const videoUpload = createUpload({
  allowedTypes: ALLOWED_VIDEO_TYPES,
  maxSizeBytes: FILE_SIZE_LIMITS.VIDEO,
});

/** Documents only, 10 MB max */
const documentUpload = createUpload({
  allowedTypes: ALLOWED_DOCUMENT_TYPES,
  maxSizeBytes: FILE_SIZE_LIMITS.DOCUMENT,
});

/** Any supported type, 10 MB max */
const anyUpload = createUpload({ maxSizeBytes: FILE_SIZE_LIMITS.DOCUMENT });

// ── Error normaliser ────────────────────────────────────────────────────────
/**
 * Wrap a multer middleware call and convert multer errors into AppErrors
 * so the global error handler can process them uniformly.
 *
 * @param {multer.Multer} multerInstance
 * @param {"single"|"array"|"fields"|"none"} method
 * @param {string|object} arg  Field name string, or array of { name, maxCount } objects
 * @param {number} [maxCount]  Used only with "array"
 * @returns {import('express').RequestHandler}
 */
const wrapMulter = (multerInstance, method, arg, maxCount) => {
  // Build the raw multer handler
  const handler =
    method === "array" ? multerInstance.array(arg, maxCount) :
      method === "fields" ? multerInstance.fields(arg) :
        method === "none" ? multerInstance.none() :
          multerInstance.single(arg);

  return (req, res, next) => {
    handler(req, res, (err) => {
      if (!err) return next();

      // Normalise multer-specific errors
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(
          new AppError(
            `File is too large. Maximum allowed size is ${Math.round(err.limit / (1024 * 1024))
            } MB.`,
            400
          )
        );
      }

      if (err.code === "LIMIT_FILE_COUNT") {
        return next(
          new AppError(`Too many files. Maximum allowed is ${err.limit}.`, 400)
        );
      }

      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return next(
          new AppError(`Unexpected field: "${err.field}".`, 400)
        );
      }

      // Pass through AppErrors (from our fileFilter) or unknown errors
      next(err);
    });
  };
};

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Single file upload middleware (images).
 * req.file will contain the file buffer after this runs.
 *
 * @param {string} fieldName    HTML input name attribute
 * @param {object} [options]    createUpload options
 */
const uploadSingle = (fieldName, options) =>
  wrapMulter(createUpload(options), "single", fieldName);

/**
 * Multiple files from the same field.
 * req.files will be an array.
 *
 * @param {string} fieldName
 * @param {number} [maxCount]
 * @param {object} [options]
 */
const uploadMultiple = (fieldName, maxCount = MAX_FILE_COUNT.MULTIPLE, options) =>
  wrapMulter(createUpload(options), "array", fieldName, maxCount);

/**
 * Multiple fields with different file types.
 * req.files will be a keyed object.
 *
 * @param {{ name: string, maxCount: number }[]} fields
 * @param {object} [options]
 */
const uploadFields = (fields, options) =>
  wrapMulter(createUpload(options), "fields", fields);

module.exports = {
  createUpload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  // Pre-built instances for common use cases
  imageUpload,
  videoUpload,
  documentUpload,
  anyUpload,
  wrapMulter,
};