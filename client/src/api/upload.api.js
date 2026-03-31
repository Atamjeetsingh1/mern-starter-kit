/**
 * api/upload.api.js
 * All HTTP calls for the upload endpoints.
 * Uses multipart/form-data — axios handles the Content-Type header automatically
 * when you pass a FormData object.
 */

import axiosInstance from "./axiosInstance";

/**
 * Upload a single avatar image.
 * @param {File}     file
 * @param {Function} [onProgress]  Called with 0-100 progress value
 */
export const uploadAvatarApi = (file, onProgress) => {
  const form = new FormData();
  form.append("avatar", file);

  return axiosInstance.post("/upload/avatar", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: onProgress
      ? (e) => onProgress(Math.round((e.loaded * 100) / e.total))
      : undefined,
  });
};

/**
 * Upload a single file of any type.
 * @param {File}     file
 * @param {Function} [onProgress]
 */
export const uploadSingleApi = (file, onProgress) => {
  const form = new FormData();
  form.append("file", file);

  return axiosInstance.post("/upload/single", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: onProgress
      ? (e) => onProgress(Math.round((e.loaded * 100) / e.total))
      : undefined,
  });
};

/**
 * Upload multiple files (up to 10).
 * @param {File[]}   files
 * @param {Function} [onProgress]
 */
export const uploadMultipleApi = (files, onProgress) => {
  const form = new FormData();
  files.forEach((file) => form.append("files", file));

  return axiosInstance.post("/upload/multiple", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: onProgress
      ? (e) => onProgress(Math.round((e.loaded * 100) / e.total))
      : undefined,
  });
};

/**
 * Upload images only (post gallery, etc.).
 * @param {File[]}   images
 * @param {Function} [onProgress]
 */
export const uploadImagesApi = (images, onProgress) => {
  const form = new FormData();
  images.forEach((img) => form.append("images", img));

  return axiosInstance.post("/upload/images", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: onProgress
      ? (e) => onProgress(Math.round((e.loaded * 100) / e.total))
      : undefined,
  });
};

/**
 * Upload a video.
 * @param {File}     videoFile
 * @param {Function} [onProgress]
 */
export const uploadVideoApi = (videoFile, onProgress) => {
  const form = new FormData();
  form.append("video", videoFile);

  return axiosInstance.post("/upload/video", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: onProgress
      ? (e) => onProgress(Math.round((e.loaded * 100) / e.total))
      : undefined,
  });
};

/**
 * Upload a document (PDF, Word, Excel, etc.).
 * @param {File}     docFile
 * @param {Function} [onProgress]
 */
export const uploadDocumentApi = (docFile, onProgress) => {
  const form = new FormData();
  form.append("document", docFile);

  return axiosInstance.post("/upload/document", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: onProgress
      ? (e) => onProgress(Math.round((e.loaded * 100) / e.total))
      : undefined,
  });
};

/**
 * Delete a file from Cloudinary by public_id.
 * @param {string} publicId      URL-encoded Cloudinary public_id
 * @param {"image"|"video"|"raw"} [type="image"]
 */
export const deleteFileApi = (publicId, type = "image") =>
  axiosInstance.delete(`/upload/${encodeURIComponent(publicId)}?type=${type}`);