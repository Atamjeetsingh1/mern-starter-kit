/**
 * validations/emailVerification.validation.js
 * Joi schemas + validation logic for email verification endpoints.
 */

const Joi      = require("joi");
const AppError = require("../utils/AppError");
const { HTTP_STATUS } = require("../constants");

// ── Validation middleware factory for req.body ─────────────────────────────
const validateBody = (schema) => (req, _res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly:    false,
    stripUnknown:  true,
  });

  if (error) {
    const errors = error.details.map((d) => ({
      field:   d.context?.key ?? "unknown",
      message: d.message.replace(/"/g, ""),
    }));
    throw new AppError("Validation failed.", HTTP_STATUS.BAD_REQUEST, errors);
  }

  req.body = value;
  next();
};

// ── Schemas ────────────────────────────────────────────────────────────────

// POST /verify-otp
const verifyOTPSchema = Joi.object({
  otp: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "string.base": "OTP must be a string.",
      "string.length": "OTP must be exactly 6 digits.",
      "string.pattern.base": "OTP must contain only numbers.",
      "any.required": "OTP is required.",
    }),
});

// POST /resend-verification
const resendVerificationSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).lowercase().trim().optional().messages({
    "string.email": "Please provide a valid email address.",
  }),
});

/**
 * GET /verify-email?token=XYZ
 * Manually validate the token from query param.
 */
const validateVerifyToken = (req, _res, next) => {
  const { token } = req.query;
  if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
    throw new AppError(
      "Invalid or missing verification token.",
      HTTP_STATUS.BAD_REQUEST
    );
  }
  next();
};

module.exports = {
  validateVerifyToken,
  validateVerifyOTP: validateBody(verifyOTPSchema),
  validateResendVerification: validateBody(resendVerificationSchema),
};
