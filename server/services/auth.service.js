/**
 * services/auth.service.js
 * Business logic for authentication.
 * Controllers call services; services talk to models and utils.
 * This separation makes the logic unit-testable without HTTP overhead.
 */

const User = require("../models/User");
const { comparePassword } = require("../utils/password.utils");
const { generateTokenPair, verifyRefreshToken } = require("../utils/token.utils");
const AppError = require("../utils/AppError");
const { HTTP_STATUS, MESSAGES } = require("../constants");

/**
 * Register a new user.
 * @param {{ name, email, password, role }} data
 * @returns {{ user: object, accessToken: string, refreshToken: string }}
 */
const registerUser = async ({ name, email, password, role }) => {
  // 1. Check for duplicate email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError(MESSAGES.EMAIL_ALREADY_EXISTS, HTTP_STATUS.CONFLICT);
  }

  // 2. Create user (password is hashed via pre-save hook in the model)
  const user = await User.create({ name, email, password, role });

  // 3. Generate token pair
  const tokens = generateTokenPair({ id: user._id, role: user.role });

  // 4. Persist hashed refresh token for server-side invalidation
  user.refreshToken = tokens.refreshToken;
  await user.save({ validateBeforeSave: false });

  return { user, ...tokens };
};

/**
 * Login an existing user.
 * @param {{ email, password }} credentials
 * @returns {{ user: object, accessToken: string, refreshToken: string }}
 */
const loginUser = async ({ email, password }) => {
  // 1. Find user and explicitly select the password field (select:false by default)
  const user = await User.findOne({ email }).select("+password");
  if (!user || !user.isActive) {
    throw new AppError(MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }

  // 2. Compare plain password against stored hash
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new AppError(MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }

  // 3. Generate token pair
  const tokens = generateTokenPair({ id: user._id, role: user.role });

  // 4. Persist new refresh token
  user.refreshToken = tokens.refreshToken;
  await user.save({ validateBeforeSave: false });

  return { user, ...tokens };
};

/**
 * Refresh the access token using a valid refresh token.
 * @param {string} refreshToken
 * @returns {{ accessToken: string, refreshToken: string }}
 */
const refreshAccessToken = async (refreshToken) => {
  // 1. Verify signature & expiry
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED);
  }

  // 2. Verify user exists and token matches the one stored in DB
  const user = await User.findById(decoded.id).select("+refreshToken");
  if (!user || user.refreshToken !== refreshToken) {
    throw new AppError(MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED);
  }

  // 3. Rotate both tokens (refresh token rotation for security)
  const tokens = generateTokenPair({ id: user._id, role: user.role });
  user.refreshToken = tokens.refreshToken;
  await user.save({ validateBeforeSave: false });

  return tokens;
};

/**
 * Logout a user by clearing their stored refresh token.
 * @param {string} userId
 */
const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
};