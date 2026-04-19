const Notification = require('../models/Notification');
const DeviceToken = require('../models/DeviceToken');
const NotificationLog = require('../models/NotificationLog');

/**
 * notification.repository.js
 *
 * DB abstraction layer — all Mongoose queries live here.
 * Service layer calls repository, never touches models directly.
 * Makes the service testable (mock the repository, not mongoose).
 */

// ─── Notification ────────────────────────────────────────────────────────────

const notificationRepo = {
  create(data) {
    return Notification.create(data);
  },

  findById(id) {
    return Notification.findById(id).lean();
  },

  /**
   * Cursor-based pagination — more scalable than skip/offset at scale.
   * Pass `cursor` (last notification's createdAt) to get next page.
   *
   * @param {object} options
   * @param {string} options.userId
   * @param {number} [options.limit=20]
   * @param {Date}   [options.cursor]     - createdAt of last item on previous page
   * @param {boolean} [options.unreadOnly]
   * @returns {Promise<{ notifications: Array, nextCursor: Date|null, hasMore: boolean }>}
   */
  async getPaginated({ userId, limit = 20, cursor = null, unreadOnly = false }) {
    const query = { userId };

    if (unreadOnly) query.isRead = false;

    // Cursor-based: fetch items older than the cursor
    if (cursor) query.createdAt = { $lt: new Date(cursor) };

    // Fetch limit + 1 to determine if there's a next page
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = notifications.length > limit;
    if (hasMore) notifications.pop(); // remove the extra item

    const nextCursor = hasMore
      ? notifications[notifications.length - 1].createdAt
      : null;

    return { notifications, nextCursor, hasMore };
  },

  updateStatus(id, status) {
    return Notification.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );
  },

  markAsRead(userId, notificationId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );
  },

  markManyAsRead(userId, notificationIds) {
    return Notification.markManyAsRead(userId, notificationIds);
  },

  markAllAsRead(userId) {
    return Notification.markAllAsRead(userId);
  },

  getUnreadCount(userId) {
    return Notification.getUnreadCount(userId);
  },

  deleteOne(userId, notificationId) {
    return Notification.findOneAndDelete({ _id: notificationId, userId });
  },
};

// ─── DeviceToken ─────────────────────────────────────────────────────────────

const deviceTokenRepo = {
  upsert({ userId, token, platform, deviceInfo }) {
    return DeviceToken.upsertToken({ userId, token, platform, deviceInfo });
  },

  getActiveTokens(userId, platform = null) {
    return DeviceToken.getActiveTokens(userId, platform);
  },

  deactivate(token) {
    return DeviceToken.deactivateToken(token);
  },

  deactivateAll(userId) {
    return DeviceToken.deactivateAllUserTokens(userId);
  },

  removeToken(token) {
    return DeviceToken.findOneAndDelete({ token });
  },
};

// ─── NotificationLog ─────────────────────────────────────────────────────────

const notificationLogRepo = {
  /**
   * Batch insert logs for all send results in one DB call.
   */
  createMany(logs) {
    return NotificationLog.insertMany(logs, { ordered: false }); // ordered:false = don't stop on error
  },

  create(log) {
    return NotificationLog.create(log);
  },

  findByNotificationId(notificationId) {
    return NotificationLog.find({ notificationId }).lean();
  },
};

module.exports = {
  notificationRepo,
  deviceTokenRepo,
  notificationLogRepo,
};
