/**
 * controllers/upload.controller.js
 * Handles all upload-related routes.
 * By the time these handlers run, multer + cloudinary middleware have already
 * parsed the multipart body and uploaded the file(s) to Cloudinary.
 * Controllers only need to persist the resulting URLs.
 */

const uploadService = require("../services/upload.service");
const asyncHandler  = require("../middleware/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { HTTP_STATUS } = require("../constants");
const AppError        = require("../utils/AppError");

/**
 * POST /api/v1/upload/avatar
 * Authenticated — upload or replace the current user's profile picture.
 * Expects: multipart/form-data with field "avatar" (single image)
 */
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file?.cloudinary) {
    throw new AppError("No image file was uploaded.", HTTP_STATUS.BAD_REQUEST);
  }

  const user = await uploadService.saveUserFile(
    req.user.id,
    "avatar",
    req.file.cloudinary
  );

  sendSuccess(res, HTTP_STATUS.OK, "Avatar updated successfully.", {
    avatar: user.avatar,
    file:   req.file.cloudinary,
  });
});

/**
 * POST /api/v1/upload/single
 * Authenticated — general-purpose single file upload.
 * Returns the Cloudinary result so the calling code can store the URL itself.
 * Expects: multipart/form-data with field "file"
 */
const uploadSingleFile = asyncHandler(async (req, res) => {
  if (!req.file?.cloudinary) {
    throw new AppError("No file was uploaded.", HTTP_STATUS.BAD_REQUEST);
  }

  sendSuccess(res, HTTP_STATUS.CREATED, "File uploaded successfully.", {
    file: req.file.cloudinary,
  });
});

/**
 * POST /api/v1/upload/multiple
 * Authenticated — upload up to 10 files in a single request.
 * Expects: multipart/form-data with field "files" (multiple)
 * Returns an array of Cloudinary results.
 */
const uploadMultipleFiles = asyncHandler(async (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];

  if (!files.length) {
    throw new AppError("No files were uploaded.", HTTP_STATUS.BAD_REQUEST);
  }

  const results = files.map((f) => f.cloudinary).filter(Boolean);

  sendSuccess(res, HTTP_STATUS.CREATED, `${results.length} file(s) uploaded successfully.`, {
    count: results.length,
    files: results,
  });
});

/**
 * DELETE /api/v1/upload/:publicId
 * Authenticated — delete a file from Cloudinary by public_id.
 * :publicId should be passed as a URL-encoded string.
 */
const deleteFile = asyncHandler(async (req, res) => {
  const { deleteFromCloudinary } = require("../utils/upload.utils");
  const publicId      = decodeURIComponent(req.params.publicId);
  const resourceType  = req.query.type || "image"; // ?type=video | ?type=raw

  await deleteFromCloudinary(publicId, resourceType);

  sendSuccess(res, HTTP_STATUS.OK, "File deleted successfully.");
});

module.exports = {
  uploadAvatar,
  uploadSingleFile,
  uploadMultipleFiles,
  deleteFile,
};