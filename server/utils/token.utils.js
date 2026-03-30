/**
 * utils/token.utils.js
 * Helpers for signing and verifying JWTs.
 * Keeps all JWT logic in one place — easy to swap library later.
 */

const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { TOKEN_TYPES } = require("../constants");

/**
 * Sign an access token.
 * @param {object} payload  - Data to embed (e.g. { id, role })
 * @returns {string}        - Signed JWT string
 */
const signAccessToken = (payload) => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    issuer: "mern-boilerplate",
    audience: "mern-client",
  });
};

/**
 * Sign a refresh token.
 * @param {object} payload  - Data to embed (typically just { id })
 * @returns {string}        - Signed JWT string
 */
const signRefreshToken = (payload) => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: "mern-boilerplate",
    audience: "mern-client",
  });
};

/**
 * Verify an access token.
 * @param {string} token - JWT string
 * @returns {object}     - Decoded payload
 * @throws               - jwt.JsonWebTokenError | jwt.TokenExpiredError
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: "mern-boilerplate",
    audience: "mern-client",
  });
};

/**
 * Verify a refresh token.
 * @param {string} token - JWT string
 * @returns {object}     - Decoded payload
 * @throws               - jwt.JsonWebTokenError | jwt.TokenExpiredError
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: "mern-boilerplate",
    audience: "mern-client",
  });
};

/**
 * Generate both tokens at once (convenience helper used in auth flow).
 * @param {object} payload - e.g. { id: user._id, role: user.role }
 * @returns {{ accessToken: string, refreshToken: string }}
 */
const generateTokenPair = (payload) => ({
  accessToken: signAccessToken(payload),
  refreshToken: signRefreshToken({ id: payload.id }), // Refresh stores minimal data
});

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
};