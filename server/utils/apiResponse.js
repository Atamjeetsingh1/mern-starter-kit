/**
 * utils/apiResponse.js
 * Helper to send consistent JSON responses throughout the API.
 *
 * Shape:
 *  {
 *    success: boolean,
 *    message: string,
 *    data: any | null,
 *    errors: any | null,   (only on failure)
 *    meta: object | null,  (pagination etc.)
 *  }
 */

/**
 * Send a success response.
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {*}      [data=null]
 * @param {object} [meta=null]  - e.g. { page, limit, total }
 */
const sendSuccess = (res, statusCode, message, data = null, meta = null) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  if (meta !== null) body.meta = meta;
  return res.status(statusCode).json(body);
};

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {*}      [errors=null] - Validation errors array etc.
 */
const sendError = (res, statusCode, message, errors = null) => {
  const body = { success: false, message };
  if (errors !== null) body.errors = errors;
  return res.status(statusCode).json(body);
};

module.exports = { sendSuccess, sendError };