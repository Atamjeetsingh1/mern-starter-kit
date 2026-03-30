/**
 * controllers/auth.controller.js
 * Thin layer — delegates all business logic to auth.service.js.
 * Responsible only for:
 *   1. Extracting data from req
 *   2. Calling the service
 *   3. Sending the HTTP response
 */

const authService = require("../services/auth.service");
const { sendSuccess } = require("../utils/apiResponse");
const { HTTP_STATUS, MESSAGES, COOKIE_NAMES } = require("../constants");
const env = require("../config/env");

// ── Cookie helper ──────────────────────────────────────────────────────────

/**
 * Set the refresh token as an HttpOnly cookie.
 * In production the cookie is also Secure + SameSite=Strict.
 */
const setRefreshTokenCookie = (res, token) => {
  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
};

// ── Handlers ───────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 * Public — create a new account.
 */
const register = async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.registerUser(req.body);

  setRefreshTokenCookie(res, refreshToken);

  return sendSuccess(
    res,
    HTTP_STATUS.CREATED,
    MESSAGES.REGISTER_SUCCESS,
    { user, accessToken }
  );
};

/**
 * POST /api/v1/auth/login
 * Public — authenticate and issue tokens.
 */
const login = async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.loginUser(req.body);

  setRefreshTokenCookie(res, refreshToken);

  return sendSuccess(
    res,
    HTTP_STATUS.OK,
    MESSAGES.LOGIN_SUCCESS,
    { user, accessToken }
  );
};

/**
 * POST /api/v1/auth/refresh-token
 * Public — issue a new access token from a valid refresh token.
 * Accepts token from body OR the HttpOnly cookie.
 */
const refreshToken = async (req, res) => {
  // Prefer cookie (more secure), fall back to body
  const token =
    req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN] || req.body.refreshToken;

  if (!token) {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ success: false, message: MESSAGES.INVALID_TOKEN });
  }

  const tokens = await authService.refreshAccessToken(token);

  setRefreshTokenCookie(res, tokens.refreshToken);

  return sendSuccess(res, HTTP_STATUS.OK, MESSAGES.TOKEN_REFRESHED, {
    accessToken: tokens.accessToken,
  });
};

/**
 * POST /api/v1/auth/logout
 * Protected — invalidate the user's refresh token.
 */
const logout = async (req, res) => {
  await authService.logoutUser(req.user.id);

  // Clear the cookie
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? "strict" : "lax",
  });

  return sendSuccess(res, HTTP_STATUS.OK, MESSAGES.LOGOUT_SUCCESS);
};

/**
 * GET /api/v1/auth/me
 * Protected — return the currently authenticated user's profile.
 */
const getMe = async (req, res) => {
  // req.user is set by the protect middleware; we only return what's safe
  return sendSuccess(res, HTTP_STATUS.OK, MESSAGES.USER_FETCHED, {
    user: req.user,
  });
};

module.exports = { register, login, refreshToken, logout, getMe };