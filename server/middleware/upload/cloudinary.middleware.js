/**
 * middleware/upload/cloudinary.middleware.js
 * ──────────────────────────────────────────
 * Takes in-memory file buffers provided by multer's memoryStorage
 * and streams them to Cloudinary via the upload_stream API.
 *
 * Must run AFTER a multer middleware.
 *
 * Usage:
 *   // Single
 *   router.post(
 *     "/avatar",
 *     uploadSingle("avatar"),          // multer: parses multipart, stores in memory
 *     cloudinaryUpload({ folder: "users", allowedTypes: "image" }),  // → Cloudinary
 *     userController.updateAvatar
 *   );
 *
 *   // Multiple
 *   router.post(
 *     "/photos",
 *     uploadMultiple("photos", 5),
 *     cloudinaryUploadMultiple({ folder: "posts", allowedTypes: "image" }),
 *     postController.createPost
 *   );
 *
 * After middleware runs, each file gains these extra properties:
 *   file.cloudinary = {
 *     public_id, secure_url, resource_type,
 *     width, height (images only), duration (videos only),
 *     format, bytes, folder
 *   }
 */

const streamifier = require("streamifier");
const cloudinary  = require("../../config/cloudinary");
const AppError    = require("../../utils/AppError");
const logger      = require("../../utils/logger");
const {
  CLOUDINARY_RESOURCE_TYPES,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
} = require("../../constants/upload.constants");

// ── Detect resource type from MIME ─────────────────────────────────────────
const detectResourceType = (mimetype) => {
  if (ALLOWED_IMAGE_TYPES.includes(mimetype)) return CLOUDINARY_RESOURCE_TYPES.IMAGE;
  if (ALLOWED_VIDEO_TYPES.includes(mimetype)) return CLOUDINARY_RESOURCE_TYPES.VIDEO;
  return CLOUDINARY_RESOURCE_TYPES.RAW; // PDFs, documents
};

// ── Stream a single buffer to Cloudinary ──────────────────────────────────
/**
 * @param {Buffer} buffer
 * @param {object} uploadOptions  Passed to cloudinary.uploader.upload_stream
 * @returns {Promise<object>} Cloudinary upload result
 */
const streamToCloudinary = (buffer, uploadOptions = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          logger.error("Cloudinary upload error:", error.message);
          return reject(
            new AppError(`Cloudinary upload failed: ${error.message}`, 500)
          );
        }
        resolve(result);
      }
    );

    // Pipe the in-memory buffer into the upload stream
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// ── Build the result object stored on req.file / req.files ────────────────
const buildCloudinaryResult = (result, folder) => ({
  public_id:     result.public_id,
  secure_url:    result.secure_url,
  resource_type: result.resource_type,
  format:        result.format,
  bytes:         result.bytes,
  folder,
  // Image dimensions
  ...(result.width  && { width:  result.width  }),
  ...(result.height && { height: result.height }),
  // Video duration
  ...(result.duration && { duration: result.duration }),
});

// ─────────────────────────────────────────────────────────────────────────────
/**
 * cloudinaryUpload — middleware for a SINGLE file (req.file).
 *
 * @param {{
 *   folder:          string,    Cloudinary folder, e.g. "users"
 *   allowedTypes?:   string[],  Extra MIME guard (already filtered by multer)
 *   transformation?: object[],  Cloudinary transformations applied on upload
 *   publicIdPrefix?: string,    Prefix for the generated public_id
 * }} options
 */
const cloudinaryUpload = ({
  folder,
  transformation = [],
  publicIdPrefix  = "",
} = {}) => {
  return async (req, _res, next) => {
    try {
      if (!req.file) return next(); // No file — let controller decide

      const resourceType = detectResourceType(req.file.mimetype);

      const result = await streamToCloudinary(req.file.buffer, {
        folder,
        resource_type: resourceType,
        ...(publicIdPrefix && { public_id: `${publicIdPrefix}_${Date.now()}` }),
        ...(transformation.length && { transformation }),
        // Auto-generate a unique public_id if not specified
        use_filename:  true,
        unique_filename: true,
        overwrite:     false,
      });

      // Attach the Cloudinary result back onto the file object
      req.file.cloudinary = buildCloudinaryResult(result, folder);

      next();
    } catch (err) {
      next(err);
    }
  };
};

// ─────────────────────────────────────────────────────────────────────────────
/**
 * cloudinaryUploadMultiple — middleware for MULTIPLE files (req.files array).
 * Uploads all files in parallel for maximum throughput.
 */
const cloudinaryUploadMultiple = ({
  folder,
  transformation = [],
  publicIdPrefix  = "",
} = {}) => {
  return async (req, _res, next) => {
    try {
      const files = Array.isArray(req.files) ? req.files : [];
      if (!files.length) return next();

      const uploadPromises = files.map(async (file) => {
        const resourceType = detectResourceType(file.mimetype);

        const result = await streamToCloudinary(file.buffer, {
          folder,
          resource_type: resourceType,
          ...(publicIdPrefix && { public_id: `${publicIdPrefix}_${Date.now()}_${Math.random().toString(36).slice(2)}` }),
          ...(transformation.length && { transformation }),
          use_filename:    true,
          unique_filename: true,
          overwrite:       false,
        });

        // Mutate each file object in place
        file.cloudinary = buildCloudinaryResult(result, folder);
        return file;
      });

      // Run all uploads concurrently — faster than sequential
      await Promise.all(uploadPromises);
      next();
    } catch (err) {
      next(err);
    }
  };
};

// ─────────────────────────────────────────────────────────────────────────────
/**
 * cloudinaryUploadFields — for mixed fields (req.files is a keyed object).
 * Each field can have its own folder and transformation options.
 *
 * @param {Record<string, { folder: string, transformation?: object[] }>} fieldConfig
 *
 * Example:
 *   cloudinaryUploadFields({
 *     avatar:     { folder: "users/avatars" },
 *     coverImage: { folder: "users/covers", transformation: [{ width: 1200 }] },
 *   })
 */
const cloudinaryUploadFields = (fieldConfig = {}) => {
  return async (req, _res, next) => {
    try {
      const filesMap = req.files; // { avatar: [File], coverImage: [File] }
      if (!filesMap || typeof filesMap !== "object") return next();

      const allUploads = [];

      for (const [fieldName, files] of Object.entries(filesMap)) {
        const config = fieldConfig[fieldName] || { folder: "misc" };

        for (const file of files) {
          const resourceType = detectResourceType(file.mimetype);

          allUploads.push(
            streamToCloudinary(file.buffer, {
              folder:        config.folder,
              resource_type: resourceType,
              use_filename:    true,
              unique_filename: true,
              overwrite:       false,
              ...(config.transformation?.length && {
                transformation: config.transformation,
              }),
            }).then((result) => {
              file.cloudinary = buildCloudinaryResult(result, config.folder);
            })
          );
        }
      }

      await Promise.all(allUploads);
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  cloudinaryUpload,
  cloudinaryUploadMultiple,
  cloudinaryUploadFields,
  streamToCloudinary,       // Exported for use in services
};