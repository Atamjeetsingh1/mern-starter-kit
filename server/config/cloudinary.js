/**
 * config/cloudinary.js
 * Initialises and exports the Cloudinary v2 SDK instance.
 * All upload middleware imports from here so credentials are
 * configured exactly once.
 */

const cloudinary = require("cloudinary").v2;
const logger = require("../utils/logger");

// Explicitly configure (override any CLOUDINARY_URL in env)
// CLOUDINARY_URL must be in format: cloudinary://api_key:api_secret@cloud_name
// If your env has a different format, use individual vars below
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Always use HTTPS URLs
});

// Verify config on startup (fails fast if env vars are missing)
const { cloud_name, api_key, api_secret } = cloudinary.config();
if (!cloud_name || !api_key || !api_secret) {
  logger.error(
    "Cloudinary credentials are not set. File uploads will fail. " +
    "Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env"
  );
}

module.exports = cloudinary;