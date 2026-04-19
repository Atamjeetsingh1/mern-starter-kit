const mongoose = require('mongoose');

/**
 * Notification Model
 *
 * Design Decisions:
 * - Separate collection (NOT embedded in User) for horizontal scalability
 * - Flat schema — no nested arrays to avoid MongoDB 16MB doc limit & update complexity
 * - Compound indexes optimized for the two dominant read patterns:
 *     1. Fetch all notifications for a user (sorted newest first)
 *     2. Fetch unread count / unread notifications for a user
 * - `data` as Mixed allows any domain payload without schema changes
 * - `channel` array kept simple (push/email) for future multi-channel support
 */

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    type: {
      type: String,
      required: true,
      index: true,
      // Examples: 'BOOKING_CREATED', 'PASSWORD_RESET', 'WELCOME', 'ORDER_SHIPPED'
      // Validated at service layer via notification.types.js
    },

    title: {
      type: String,
      required: true,
      maxlength: 100,
    },

    body: {
      type: String,
      required: true,
      maxlength: 500,
    },

    // Arbitrary domain metadata — bookingId, orderId, etc.
    // Never put sensitive data here (tokens, passwords, PII beyond IDs)
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },

    // Which channels were used to deliver this notification
    channels: {
      type: [String],
      enum: ['push', 'email', 'sms', 'in-app'],
      default: ['push'],
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    versionKey: false,
  }
);

// ─── Indexes ────────────────────────────────────────────────────────────────

// Primary read pattern: fetch a user's notifications, newest first
notificationSchema.index({ userId: 1, createdAt: -1 });

// Unread count + unread filter — very frequent query
notificationSchema.index({ userId: 1, isRead: 1 });

// Filter by type per user (e.g., show only BOOKING_* notifications)
notificationSchema.index({ userId: 1, type: 1 });

// TTL index: auto-delete notifications older than 90 days
// Remove this if you want permanent history
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 } // 90 days
);

// ─── Statics ────────────────────────────────────────────────────────────────

/**
 * Mark multiple notifications as read atomically
 */
notificationSchema.statics.markManyAsRead = function (userId, notificationIds) {
  return this.updateMany(
    {
      _id: { $in: notificationIds },
      userId,
      isRead: false,
    },
    {
      $set: { isRead: true, readAt: new Date() },
    }
  );
};

/**
 * Mark ALL notifications for a user as read
 */
notificationSchema.statics.markAllAsRead = function (userId) {
  return this.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
};

/**
 * Get unread count for a user — used for badge/counter
 */
notificationSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({ userId, isRead: false });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
