const asyncHandler = require('../middleware/asyncHandler');
const notificationService = require('../services/notification.service');
const { HTTP_STATUS } = require('../constants');

/**
 * notification.controller.js
 *
 * Thin HTTP layer. No business logic here — just:
 *   - Parse request
 *   - Call service
 *   - Format response
 */

/**
 * GET /api/v1/notifications
 * Query: limit, cursor, unreadOnly
 */
const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const limit = Math.min(parseInt(req.query.limit) || 20, 50); // cap at 50
  const cursor = req.query.cursor ?? null;
  const unreadOnly = req.query.unreadOnly === 'true';

  const result = await notificationService.getUserNotifications({
    userId,
    limit,
    cursor,
    unreadOnly,
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result.notifications,
    pagination: {
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    },
  });
});

/**
 * GET /api/v1/notifications/unread-count
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user._id);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { count },
  });
});

/**
 * PATCH /api/v1/notifications/:id/read
 */
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(
    req.user._id,
    req.params.id
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: notification,
  });
});

/**
 * PATCH /api/v1/notifications/read-many
 * Body: { notificationIds: string[] }
 */
const markManyAsRead = asyncHandler(async (req, res) => {
  const { notificationIds } = req.body;

  if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'notificationIds must be a non-empty array',
    });
  }

  // Cap batch size to prevent abuse
  const limited = notificationIds.slice(0, 100);

  await notificationService.markManyAsRead(req.user._id, limited);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Notifications marked as read',
  });
});

/**
 * PATCH /api/v1/notifications/read-all
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user._id);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'All notifications marked as read',
  });
});

/**
 * DELETE /api/v1/notifications/:id
 */
const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.user._id, req.params.id);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Notification deleted',
  });
});

/**
 * POST /api/v1/notifications/device-token
 * Body: { token, platform, deviceInfo? }
 */
const registerDeviceToken = asyncHandler(async (req, res) => {
  const { token, platform, deviceInfo } = req.body;

  await notificationService.registerDeviceToken({
    userId: req.user._id,
    token,
    platform,
    deviceInfo,
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Device token registered',
  });
});

/**
 * DELETE /api/v1/notifications/device-token
 * Body: { token }
 * Called on logout from a specific device
 */
const removeDeviceToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'token is required',
    });
  }

  await notificationService.removeDeviceToken(token);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Device token removed',
  });
});

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markManyAsRead,
  markAllAsRead,
  deleteNotification,
  registerDeviceToken,
  removeDeviceToken,
};
