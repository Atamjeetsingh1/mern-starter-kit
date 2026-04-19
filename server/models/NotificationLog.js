const mongoose = require('mongoose');

/**
 * NotificationLog Model — Delivery Audit Trail
 *
 * Design Decisions:
 * - Write-heavy, read-rarely — optimized for append-only inserts
 * - Separate from Notification model to keep notification queries lean
 * - TTL index to auto-purge old logs (30 days default) — keeps collection small
 * - No references back to Notification doc to avoid JOIN-like lookups in hot paths
 *   (notificationId is stored as ObjectId but no populate needed typically)
 */

const notificationLogSchema = new mongoose.Schema(
  {
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification',
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    channel: {
      type: String,
      enum: ['push', 'email', 'sms', 'in-app'],
      required: true,
    },

    status: {
      type: String,
      enum: ['success', 'failure'],
      required: true,
    },

    // FCM message ID on success, null on failure
    providerMessageId: {
      type: String,
      default: null,
    },

    // Structured error on failure
    error: {
      code: String,
      message: String,
    },

    // Token used for this send attempt (for debugging stale token issues)
    deviceToken: {
      type: String,
      default: null,
    },

    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // No updatedAt needed — logs are immutable
    timestamps: { createdAt: 'createdAt', updatedAt: false },
    versionKey: false,
  }
);

// ─── Indexes ────────────────────────────────────────────────────────────────

// Lookup all logs for a specific notification
notificationLogSchema.index({ notificationId: 1 });

// TTL: auto-purge logs after 30 days
notificationLogSchema.index(
  { sentAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 }
);

const NotificationLog = mongoose.model('NotificationLog', notificationLogSchema);

module.exports = NotificationLog;
