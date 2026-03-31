/**
 * services/upload.service.js
 * Business logic for persisting, replacing, and deleting uploaded files.
 * Controllers call these methods — never the Cloudinary SDK directly.
 */

const User      = require("../models/User");
const { deleteFromCloudinary, getPublicIdFromUrl } = require("../utils/upload.utils");
const AppError  = require("../utils/AppError");
const { HTTP_STATUS } = require("../constants");

/**
 * Persist a single uploaded file URL to a user's field.
 * If the user already has a file in that field, the old one is deleted
 * from Cloudinary first to avoid orphaned assets.
 *
 * @param {string} userId
 * @param {string} field          Mongoose field name, e.g. "avatar"
 * @param {object} cloudinaryResult  req.file.cloudinary
 * @returns {Promise<object>} Updated user document
 */
const saveUserFile = async (userId, field, cloudinaryResult) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found.", HTTP_STATUS.NOT_FOUND);

  // Delete the old file from Cloudinary if one exists
  const oldUrl = user[field];
  if (oldUrl) {
    const oldPublicId = getPublicIdFromUrl(oldUrl);
    await deleteFromCloudinary(oldPublicId, cloudinaryResult.resource_type);
  }

  // Persist the new URL
  user[field] = cloudinaryResult.secure_url;
  await user.save({ validateBeforeSave: false });

  return user;
};

/**
 * Append multiple file URLs to an array field on any document.
 * (Generic — works with any Mongoose model that has an array field.)
 *
 * @param {object} Model            Mongoose model
 * @param {string} docId
 * @param {string} arrayField       e.g. "images", "attachments"
 * @param {object[]} cloudinaryResults  Array of req.files[n].cloudinary
 * @returns {Promise<object>} Updated document
 */
const appendFilesToDocument = async (Model, docId, arrayField, cloudinaryResults) => {
  const urls = cloudinaryResults.map((r) => ({
    url:        r.secure_url,
    public_id:  r.public_id,
    resource_type: r.resource_type,
    ...(r.width  && { width:  r.width  }),
    ...(r.height && { height: r.height }),
    ...(r.format && { format: r.format }),
    uploadedAt: new Date(),
  }));

  const doc = await Model.findByIdAndUpdate(
    docId,
    { $push: { [arrayField]: { $each: urls } } },
    { new: true, runValidators: false }
  );

  if (!doc) throw new AppError("Document not found.", HTTP_STATUS.NOT_FOUND);
  return doc;
};

/**
 * Remove a specific file from a document's array field and delete it from Cloudinary.
 *
 * @param {object} Model
 * @param {string} docId
 * @param {string} arrayField
 * @param {string} publicId    Cloudinary public_id of the file to remove
 * @param {"image"|"video"|"raw"} [resourceType="image"]
 */
const removeFileFromDocument = async (
  Model, docId, arrayField, publicId, resourceType = "image"
) => {
  // Remove from Cloudinary first
  await deleteFromCloudinary(publicId, resourceType);

  // Pull from the DB array
  const doc = await Model.findByIdAndUpdate(
    docId,
    { $pull: { [arrayField]: { public_id: publicId } } },
    { new: true }
  );

  if (!doc) throw new AppError("Document not found.", HTTP_STATUS.NOT_FOUND);
  return doc;
};

module.exports = {
  saveUserFile,
  appendFilesToDocument,
  removeFileFromDocument,
};