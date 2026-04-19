const {
  notificationRepo,
  deviceTokenRepo,
  notificationLogRepo,
} = require('../repositories/notification.repository');
const { resolveTemplate } = require('./providers/notification.templates');
const { VALID_TYPES } = require('../constants/notification.types');
const {
  sendToMultipleTokens,
  isTokenInvalidError,
} = require('./providers/firebase.provider');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * notification.service.js
 *
 * Core business logic for the notification system.
 * Controllers and other services call these functions.
 * Never imports from controllers or routes.
 */

// ─── Send Notification ───────────────────────────────────────────────────────

/**
 * Primary entry point. Call this from any service (auth, booking, etc.)
 *
 * @param {object} options
 * @param {string|ObjectId} options.userId   - Recipient user ID
 * @param {string}          options.type     - NOTIFICATION_TYPES value
 * @param {object}          [options.data]   - Domain metadata (bookingId, etc.)
 * @param {string[]}        [options.channels] - ['push'] by default
 * @returns {Promise<Notification>}
 *
 * @example
 * await sendNotification({ userId, type: 'BOOKING_CREATED', data: { bookingId } })
 */
async function sendNotification({ userId, type, data = {}, channels = ['push'] }) {
  // ── 1. Validate type
  if (!VALID_TYPES.has(type)) {
    throw new AppError(`Unknown notification type: ${type}`, 400);
  }

  // ── 2. Resolve title/body from template
  const { title, body } = resolveTemplate(type, data);

  // ── 3. Persist notification (always, even if push fails)
  const notification = await notificationRepo.create({
    userId,
    type,
    title,
    body,
    data,
    status: 'pending',
    channels,
  });

  // ── 4. Send push if requested — non-blocking on failure
  if (channels.includes('push')) {
    // Fire and forget — don't await this in the caller's hot path
    _sendPushAndLog(notification, data).catch((err) =>
      logger.error('Push send pipeline failed', { notificationId: notification._id, err })
    );
  }

  return notification;
}

/**
 * Internal: send FCM push + update status + write logs.
 * Separated so it can run async without blocking the caller.
 */
async function _sendPushAndLog(notification, data) {
  const tokens = await deviceTokenRepo.getActiveTokens(notification.userId);

  if (!tokens.length) {
    logger.debug('No active device tokens for user', { userId: notification.userId });
    await notificationRepo.updateStatus(notification._id, 'sent'); // Not an error — just no devices
    return;
  }

  const tokenStrings = tokens.map((t) => t.token);
  const results = await sendToMultipleTokens(
    tokenStrings,
    { title: notification.title, body: notification.body },
    data
  );

  // ── Build logs + handle invalid tokens
  const logs = [];
  const invalidTokens = [];

  for (const result of results) {
    logs.push({
      notificationId: notification._id,
      userId: notification.userId,
      channel: 'push',
      status: result.success ? 'success' : 'failure',
      providerMessageId: result.messageId,
      deviceToken: result.token,
      error: result.error ?? undefined,
      sentAt: new Date(),
    });

    // If FCM says token is invalid, deactivate it
    if (!result.success && result.error && isTokenInvalidError(result.error.code)) {
      invalidTokens.push(result.token);
    }
  }

  // Batch DB operations
  const hasSuccess = results.some((r) => r.success);
  await Promise.allSettled([
    notificationRepo.updateStatus(notification._id, hasSuccess ? 'sent' : 'failed'),
    notificationLogRepo.createMany(logs),
    ...invalidTokens.map((token) => deviceTokenRepo.deactivate(token)),
  ]);

  if (invalidTokens.length) {
    logger.info('Deactivated invalid FCM tokens', { count: invalidTokens.length });
  }
}

// ─── Batch Send ──────────────────────────────────────────────────────────────

/**
 * Send the same notification to multiple users (e.g., announcements).
 * Runs sequentially in batches to avoid memory spike.
 *
 * @param {string[]} userIds
 * @param {{ type: string, data?: object, channels?: string[] }} payload
 */
async function sendBulkNotification(userIds, { type, data = {}, channels = ['push'] }) {
  const BATCH_SIZE = 100;
  const results = { success: 0, failed: 0 };

  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE);

    const settled = await Promise.allSettled(
      batch.map((userId) => sendNotification({ userId, type, data, channels }))
    );

    settled.forEach((r) => {
      if (r.status === 'fulfilled') results.success++;
      else results.failed++;
    });
  }

  logger.info('Bulk notification complete', { total: userIds.length, ...results });
  return results;
}

// ─── Read / Query ────────────────────────────────────────────────────────────

/**
 * Fetch paginated notifications for a user.
 * Uses cursor-based pagination for scalability.
 */
async function getUserNotifications({ userId, limit, cursor, unreadOnly }) {
  return notificationRepo.getPaginated({ userId, limit, cursor, unreadOnly });
}

/**
 * Get unread notification count — for badge/counter in UI.
 */
async function getUnreadCount(userId) {
  return notificationRepo.getUnreadCount(userId);
}

// ─── Mark as Read ────────────────────────────────────────────────────────────

async function markAsRead(userId, notificationId) {
  const notification = await notificationRepo.markAsRead(userId, notificationId);
  if (!notification) throw new AppError('Notification not found', 404);
  return notification;
}

async function markManyAsRead(userId, notificationIds) {
  return notificationRepo.markManyAsRead(userId, notificationIds);
}

async function markAllAsRead(userId) {
  return notificationRepo.markAllAsRead(userId);
}

// ─── Device Tokens ───────────────────────────────────────────────────────────

/**
 * Register or refresh a device token.
 * Call this on every app launch / login.
 */
async function registerDeviceToken({ userId, token, platform, deviceInfo }) {
  if (!token || !platform) {
    throw new AppError('token and platform are required', 400);
  }
  return deviceTokenRepo.upsert({ userId, token, platform, deviceInfo });
}

/**
 * Remove a token on logout (single device).
 */
async function removeDeviceToken(token) {
  return deviceTokenRepo.removeToken(token);
}

/**
 * Remove all tokens on logout (all devices) or account suspension.
 */
async function removeAllDeviceTokens(userId) {
  return deviceTokenRepo.deactivateAll(userId);
}

// ─── Delete ──────────────────────────────────────────────────────────────────

async function deleteNotification(userId, notificationId) {
  const notification = await notificationRepo.deleteOne(userId, notificationId);
  if (!notification) throw new AppError('Notification not found', 404);
  return notification;
}

module.exports = {
  sendNotification,
  sendBulkNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markManyAsRead,
  markAllAsRead,
  registerDeviceToken,
  removeDeviceToken,
  removeAllDeviceTokens,
  deleteNotification,
};
