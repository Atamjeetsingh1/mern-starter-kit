/**
 * validations/password.validation.js
 * Joi request-body validation for the password reset flow.
 *
 * NOTE: resetPassword validates req.body only.
 *       The :token URL param is validated separately via validateTokenParam.
 */

const Joi      = require("joi");
const AppError = require("../utils/AppError");
const { HTTP_STATUS } = require("../constants");

// ── Schemas ────────────────────────────────────────────────────────────────

const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .required()
    .messages({
      "string.email": "Please provide a valid email address.",
      "any.required": "Email is required.",
    }),
});

// Token now comes from :token URL param — body only needs the new password
const resetPasswordSchema = Joi.object({
  password: Joi.string()
    .min(8)
    .max(72)
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters.",
      "string.max": "Password cannot exceed 72 characters.",
      "any.required": "New password is required.",
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref("password"))
    .required()
    .messages({
      "any.only": "Passwords do not match.",
      "any.required": "Please confirm your password.",
    }),
});

// ── Validation middleware factory ──────────────────────────────────────────
const validate = (schema) => (req, _res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly:    false,   // Collect ALL errors in one pass
    stripUnknown:  true,    // Remove unrecognised keys
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

/**
 * validateTokenParam — guard: ensure :token is present and looks like a 64-char hex string.
 * Keeps the controller clean from manual param checks.
 */
const validateTokenParam = (req, _res, next) => {
  const { token } = req.params;
  if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
    throw new AppError(
      "Invalid or malformed reset token.",
      HTTP_STATUS.BAD_REQUEST
    );
  }
  next();
};

module.exports = {
  validateForgotPassword: validate(forgotPasswordSchema),
  validateResetPassword:  validate(resetPasswordSchema),
  validateTokenParam,
};