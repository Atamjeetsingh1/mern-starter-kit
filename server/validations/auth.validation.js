/**
 * validations/auth.validation.js
 * Joi schemas + validation middleware for auth endpoints.
 * Keeps validation logic out of controllers and services.
 */

const Joi = require("joi");
const AppError = require("../utils/AppError");
const { HTTP_STATUS, USER_ROLES } = require("../constants");

// ── Reusable field definitions ─────────────────────────────────────────────
const emailField = Joi.string().email({ tlds: { allow: false } }).lowercase().trim().required();
const passwordField = Joi.string()
  .min(8)
  .max(72) // bcrypt silently truncates above 72 chars — enforce here
  .required();

// ── Schemas ────────────────────────────────────────────────────────────────

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(60).trim().required(),
  email: emailField,
  password: passwordField,
  role: Joi.string()
    .valid(...Object.values(USER_ROLES).filter((r) => r !== "admin")) // Disallow self-assigning admin
    .default(USER_ROLES.CUSTOMER),
});

const loginSchema = Joi.object({
  email: emailField,
  password: passwordField,
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

// ── Validation middleware factory ──────────────────────────────────────────

/**
 * validate — returns Express middleware that validates req.body against schema.
 * On error it throws an AppError with field-level detail.
 * @param {Joi.Schema} schema
 */
const validate = (schema) => (req, _res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false, // Collect ALL errors in one pass
    allowUnknown: false,
    stripUnknown: true, // Remove unrecognised keys silently
  });

  if (error) {
    const errors = error.details.map((d) => ({
      field: d.context.key,
      message: d.message.replace(/"/g, ""), // Strip Joi's extra quotes
    }));
    throw new AppError("Validation failed.", HTTP_STATUS.BAD_REQUEST, errors);
  }

  // Replace req.body with the sanitised / type-coerced Joi output
  req.body = value;
  next();
};

module.exports = {
  validateRegister: validate(registerSchema),
  validateLogin: validate(loginSchema),
  validateRefreshToken: validate(refreshTokenSchema),
};