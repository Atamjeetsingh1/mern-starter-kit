const express = require('express');
const notificationController = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// All notification routes require authentication
router.use(protect);

// ─── Notifications ───────────────────────────────────────────────────────────

/**
 * GET    /api/v1/notifications
 *        ?limit=20&cursor=<ISO date>&unreadOnly=true
 */
router.get('/', notificationController.getNotifications);

/**
 * GET    /api/v1/notifications/unread-count
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * PATCH  /api/v1/notifications/read-all
 */
router.patch('/read-all', notificationController.markAllAsRead);

/**
 * PATCH  /api/v1/notifications/read-many
 *        Body: { notificationIds: string[] }
 */
router.patch('/read-many', notificationController.markManyAsRead);

/**
 * PATCH  /api/v1/notifications/:id/read
 */
router.patch('/:id/read', notificationController.markAsRead);

/**
 * DELETE /api/v1/notifications/:id
 */
router.delete('/:id', notificationController.deleteNotification);

// ─── Device Tokens ───────────────────────────────────────────────────────────

/**
 * POST   /api/v1/notifications/device-token
 *        Body: { token, platform, deviceInfo? }
 */
router.post('/device-token', notificationController.registerDeviceToken);

/**
 * DELETE /api/v1/notifications/device-token
 *        Body: { token }
 */
router.delete('/device-token', notificationController.removeDeviceToken);

module.exports = router;
