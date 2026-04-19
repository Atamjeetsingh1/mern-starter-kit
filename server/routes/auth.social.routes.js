/**
 * routes/auth.social.routes.js
 * Mounts social auth endpoints onto the main auth router.
 *
 * Mount in auth.routes.js:
 *   const socialRoutes = require("./auth.social.routes");
 *   router.use("/", socialRoutes);
 */

const express    = require("express");
const Joi        = require("joi");
const { socialLogin } = require("../controllers/auth.social.controller");
const AppError   = require("../utils/AppError");
const { HTTP_STATUS } = require("../constants");

const router = express.Router();

// ── Joi schema for /social-login ───────────────────────────────────────────
const socialLoginSchema = Joi.object({
  idToken:  Joi.string().min(10).required().messages({
    "string.empty": "ID token is required.",
    "any.required": "ID token is required.",
  }),
  provider: Joi.string().valid("google", "facebook", "apple").required().messages({
    "any.only":    "Provider must be one of: google, facebook, apple.",
    "any.required":"Provider is required.",
  }),
});

// ── Validation middleware ──────────────────────────────────────────────────
const validateSocialLogin = (req, _res, next) => {
  const { error } = socialLoginSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const message = error.details.map((d) => d.message).join(" ");
    return next(new AppError(message, HTTP_STATUS.BAD_REQUEST));
  }
  next();
};

// ── Routes ─────────────────────────────────────────────────────────────────
// POST /api/v1/auth/social-login
router.post("/social-login", validateSocialLogin, socialLogin);

module.exports = router;
