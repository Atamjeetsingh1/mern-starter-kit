/**
 * controllers/user.controller.js
 * Handles all /api/v1/users routes.
 * Delegates business logic to user.service.js.
 */

const userService = require("../services/user.service");
const { sendSuccess } = require("../utils/apiResponse");
const { HTTP_STATUS, MESSAGES } = require("../constants");
const AppError = require("../utils/AppError");

/**
 * GET /api/v1/users
 * Admin / Provider only — paginated list of all active users.
 */
const getAllUsers = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const { role } = req.query;

  const { users, total, ...pagination } = await userService.getAllUsers({
    page,
    limit,
    role,
  });

  return sendSuccess(res, HTTP_STATUS.OK, MESSAGES.USERS_FETCHED, users, {
    total,
    ...pagination,
    totalPages: Math.ceil(total / limit),
  });
};

/**
 * GET /api/v1/users/:id
 * Protected — fetch a single user by ID.
 * A customer can only fetch their own profile.
 */
const getUserById = async (req, res) => {
  const { id } = req.params;

  // Customers may only view their own profile
  if (req.user.role === "customer" && req.user.id !== id) {
    throw new AppError(MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
  }

  const user = await userService.getUserById(id);
  return sendSuccess(res, HTTP_STATUS.OK, MESSAGES.USER_FETCHED, { user });
};

/**
 * GET /api/v1/users/profile
 * Protected — return the logged-in user's own profile.
 */
const getMyProfile = async (req, res) => {
  const user = await userService.getUserById(req.user.id);
  return sendSuccess(res, HTTP_STATUS.OK, MESSAGES.USER_FETCHED, { user });
};

/**
 * PATCH /api/v1/users/:id
 * Protected — update a user's profile.
 * Users can only update their own; admins can update any.
 */
const updateUser = async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== "admin" && req.user.id !== id) {
    throw new AppError(MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
  }

  const user = await userService.updateUser(id, req.body);
  return sendSuccess(res, HTTP_STATUS.OK, MESSAGES.USER_UPDATED, { user });
};

/**
 * DELETE /api/v1/users/:id
 * Admin only — soft-delete a user.
 */
const deleteUser = async (req, res) => {
  await userService.deleteUser(req.params.id);
  return sendSuccess(res, HTTP_STATUS.OK, MESSAGES.USER_DELETED);
};

module.exports = { getAllUsers, getUserById, getMyProfile, updateUser, deleteUser };