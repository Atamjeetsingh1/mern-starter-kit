/**
 * controllers/auth.social.controller.js
 * Handles POST /api/v1/auth/social-login
 *
 * Flow:
 *  1. Validate request body (idToken + provider)
 *  2. Verify Firebase ID token → decoded user info
 *  3. Upsert user in MongoDB
 *  4. Sign a short-lived JWT → set httpOnly cookie
 *  5. Return sanitised user object
 *
 * Edge cases handled:
 *  - Expired / revoked Firebase tokens
 *  - Missing email (Apple on second+ sign-in)
 *  - Malformed request body
 *  - Existing email registered via different provider
 *  - DB upsert race condition (findOneAndUpdate with upsert is atomic)
 *  - Apple name only present on first auth → persisted immediately
 */

const admin       = require("../config/firebase.admin");
const User        = require("../models/User");
const jwt         = require("jsonwebtoken");
const env         = require("../config/env");
const asyncHandler = require("../middleware/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { HTTP_STATUS, COOKIE_NAMES, MESSAGES, USER_ROLES } = require("../constants");
const logger      = require("../utils/logger");

// Map Firebase sign_in_provider to our User model provider enum
const PROVIDER_MAP = {
  "google.com": "google",
  "facebook.com": "facebook",
  "apple.com": "apple",
};

// ── Allowed provider names (keep in sync with frontend) ───────────────────
const ALLOWED_PROVIDERS = new Set(["google", "facebook", "apple"]);

// ── JWT cookie options ─────────────────────────────────────────────────────
const getCookieOptions = () => ({
  httpOnly:  true,                              // Not accessible via JS
  secure:    env.isProd,                        // HTTPS only in prod
  sameSite:  env.isProd ? "strict" : "lax",
  maxAge:    7 * 24 * 60 * 60 * 1000,           // 7 days in ms
  path:      "/",
});

// ── Helper: sign JWT ───────────────────────────────────────────────────────
const signToken = (userId) =>
  jwt.sign({ id: userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN || "15m",
  });

// ── Helper: sanitise user for response ────────────────────────────────────
const sanitiseUser = (user) => ({
  _id:             user._id,
  name:            user.name,
  email:           user.email,
  avatar:          user.avatar,
  role:            user.role,
  isEmailVerified: user.isEmailVerified,
  provider:        user.provider,
  createdAt:       user.createdAt,
});

// ─────────────────────────────────────────────────────────────────────────────
// Controller
// ─────────────────────────────────────────────────────────────────────────────

/**
 * socialLogin
 * POST /api/v1/auth/social-login
 * Body: { idToken: string, provider: "google"|"facebook"|"apple" }
 */
const socialLogin = asyncHandler(async (req, res) => {
    const { idToken, provider } = req.body;

    // ── 1. Input validation ──────────────────────────────────────────────
    if (!idToken || typeof idToken !== "string" || idToken.trim().length === 0) {
      const error = new Error("ID token is required.");
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }
    if (!provider || !ALLOWED_PROVIDERS.has(provider)) {
      const error = new Error(
        `Invalid provider. Must be one of: ${[...ALLOWED_PROVIDERS].join(", ")}.`
      );
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    // ── 2. Verify Firebase ID token ─────────────────────────────────────
    let decoded;
    try {
      // checkRevoked=true protects against sign-out → stolen token replay
      decoded = await admin.auth().verifyIdToken(idToken.trim(), true);
    } catch (firebaseErr) {
      const code    = firebaseErr.code || "";
      const message = code.includes("revoked")
        ? "Session has been revoked. Please sign in again."
        : code.includes("expired")
        ? "Authentication token expired. Please sign in again."
        : "Invalid authentication token.";

      logger.warn(`[socialLogin] Firebase token error (${code}): ${firebaseErr.message}`);
      const error = new Error(message);
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw error;
    }

    // ── 3. Extract user info from decoded token ──────────────────────────
    const {
      uid,
      email,
      name,
      picture,
      email_verified,
      firebase: { sign_in_provider },
    } = decoded;

    // Apple doesn't always return email (only on first auth)
    // If missing, we cannot create a usable account
    if (!email) {
      logger.warn(`[socialLogin] No email in Firebase token for uid: ${uid}`);
      const error = new Error(
        "Email address is required but was not provided by your sign-in provider. Please use a different sign-in method."
      );
      error.statusCode = HTTP_STATUS.UNPROCESSABLE;
      throw error;
    }

    // ── 4. Upsert user in MongoDB ─────────────────────────────────────────
    // findOneAndUpdate with upsert is atomic → safe against race conditions
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        $setOnInsert: {
          // Only set these on creation — don't overwrite on subsequent logins
          email:    email.toLowerCase(),
          role:     USER_ROLES.CUSTOMER,
          password: undefined, // Social users have no password
        },
        $set: {
          // Always update on login
          provider:        PROVIDER_MAP[sign_in_provider] || provider,
          firebaseUid:     uid,
          isEmailVerified: email_verified ?? true, // Social providers verify email
          lastLoginAt:     new Date(),
          // Update name only if we have one AND the stored name is empty
          ...(name && { $setOnInsert: undefined }), // handled below
        },
      },
      {
        new:            true,
        upsert:         true,
        runValidators:  true,
        // Return the document after update
        setDefaultsOnInsert: true,
      }
    );

    // Update name only if empty (e.g. second Apple sign-in won't wipe stored name)
    if (name && !user.name) {
      user.name = name;
    }

    // Update avatar only if empty or changed
    if (picture && user.avatar !== picture) {
      user.avatar = picture;
    }

    await user.save({ validateBeforeSave: false });

    // ── 5. Sign JWT + set httpOnly cookie ─────────────────────────────────
    const token = signToken(user._id);
    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, token, getCookieOptions());

    logger.info(`[socialLogin] User ${user._id} signed in via ${provider}`);

    // ── 6. Respond ────────────────────────────────────────────────────────
    return sendSuccess(res, HTTP_STATUS.OK, MESSAGES.LOGIN_SUCCESS, {
      user:    sanitiseUser(user),
      accessToken: token, // Also return for Authorization header usage
    });
});

module.exports = { socialLogin, ALLOWED_PROVIDERS };
