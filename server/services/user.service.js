/**
 * services/user.service.js
 * Business logic for user management.
 */

const User = require("../models/User");
const AppError = require("../utils/AppError");
const { HTTP_STATUS, MESSAGES } = require("../constants");

/**
 * Fetch a single user by ID.
 * @param {string} userId
 * @returns {Promise<object>}
 */
const getUserById = async (userId) => {
  const user = await User.findById(userId);
  console.log("Fetched user:", user);
  if (!user || !user.isActive) {
    throw new AppError(MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  return user;
};

/**
 * Fetch all active users (admin / provider access).
 * @param {{ page?: number, limit?: number, role?: string }} options
 * @returns {{ users: object[], total: number, page: number, limit: number }}
 */
const getAllUsers = async ({ page = 1, limit = 20, role } = {}) => {
  const filter = { isActive: true };
  if (role) filter.role = role;

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  return { users, total, page, limit };
};

/**
 * Update a user's own profile (name only — email/password change handled separately).
 * @param {string} userId
 * @param {{ name?: string }} updates
 * @returns {Promise<object>}
 */
const updateUser = async (userId, updates) => {
  // Whitelist updatable fields to prevent mass-assignment
  const allowedUpdates = { name: updates.name };

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: allowedUpdates },
    { new: true, runValidators: true }
  );
  if (!user) throw new AppError(MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  return user;
};

/**
 * Soft-delete a user by setting isActive = false.
 * @param {string} userId
 */
const deleteUser = async (userId) => {
  const user = await User.findByIdAndUpdate(userId, { isActive: false }, { new: true });
  if (!user) throw new AppError(MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
};

module.exports = { getUserById, getAllUsers, updateUser, deleteUser };