/**
 * utils/upload.utils.js
 * Utility helpers for Cloudinary operations used outside of middleware.
 * Controllers and services import these instead of the SDK directly.
 */

const cloudinary = require("../config/cloudinary");
const logger     = require("./logger");

/**
 * Delete a file from Cloudinary by its public_id.
 * Silently logs the error instead of throwing — a delete failure should
 * never crash the main request flow.
 *
 * @param {string} publicId              Cloudinary public_id (e.g. "users/abc123")
 * @param {"image"|"video"|"raw"} [resourceType="image"]
 */
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  if (!publicId) return;
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    logger.info(`Cloudinary delete: ${publicId} → ${result.result}`);
    return result;
  } catch (err) {
    logger.warn(`Cloudinary delete failed for ${publicId}: ${err.message}`);
  }
};

/**
 * Extract the public_id from a full Cloudinary URL.
 * e.g. "https://res.cloudinary.com/demo/image/upload/v1/users/abc123.jpg"
 *      → "users/abc123"
 *
 * @param {string} url
 * @returns {string|null}
 */
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  try {
    // Remove version segment (/v\d+/) if present, then strip extension
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    const afterUpload = parts[1].replace(/^v\d+\//, "");
    return afterUpload.replace(/\.[^/.]+$/, ""); // strip extension
  } catch {
    return null;
  }
};

/**
 * Build a Cloudinary transformation URL for image resizing on the fly.
 * Useful for generating thumbnails without a separate upload.
 *
 * @param {string} publicId
 * @param {{ width?: number, height?: number, crop?: string, quality?: string }} options
 * @returns {string} Transformed URL
 */
const buildTransformUrl = (publicId, options = {}) => {
  const {
    width   = 400,
    height  = 400,
    crop    = "fill",
    quality = "auto",
    format  = "auto",
  } = options;

  return cloudinary.url(publicId, {
    transformation: [
      { width, height, crop, quality, fetch_format: format },
    ],
    secure: true,
  });
};

module.exports = {
  deleteFromCloudinary,
  getPublicIdFromUrl,
  buildTransformUrl,
};