const mongoose = require('mongoose');

/**
 * DeviceToken Model
 *
 * Design Decisions:
 * - Separate collection from User — one user can have many devices (phone, tablet, web)
 * - `token` is unique to prevent duplicate registrations
 * - `isActive` flag instead of hard-delete — allows graceful token invalidation
 * - `lastUsedAt` lets you prune stale tokens (e.g. > 60 days unused)
 * - Compound index on (userId, platform) supports "send to all iOS devices of user"
 */

const deviceTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    token: {
      type: String,
      required: true,
      unique: true, // FCM tokens are globally unique
      trim: true,
    },

    platform: {
      type: String,
      enum: ['web', 'android', 'ios'],
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Updated every time this token is used to send a notification
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },

    // Device metadata — optional but useful for debugging
    deviceInfo: {
      model: String,    // e.g. "iPhone 14"
      osVersion: String, // e.g. "iOS 17.2"
      appVersion: String, // e.g. "2.1.0"
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ─── Indexes ────────────────────────────────────────────────────────────────

// Fetch all active tokens for a user
deviceTokenSchema.index({ userId: 1, isActive: 1 });

// Filter by platform per user
deviceTokenSchema.index({ userId: 1, platform: 1 });

// ─── Statics ────────────────────────────────────────────────────────────────

/**
 * Upsert a device token — safe to call on every app launch
 * Updates lastUsedAt and reactivates if previously deactivated
 */
deviceTokenSchema.statics.upsertToken = function ({ userId, token, platform, deviceInfo }) {
  return this.findOneAndUpdate(
    { token },
    {
      $set: {
        userId,
        platform,
        isActive: true,
        lastUsedAt: new Date(),
        ...(deviceInfo && { deviceInfo }),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

/**
 * Deactivate a specific token (e.g., user logs out from this device)
 */
deviceTokenSchema.statics.deactivateToken = function (token) {
  return this.findOneAndUpdate({ token }, { $set: { isActive: false } });
};

/**
 * Deactivate ALL tokens for a user (e.g., account suspended, security reset)
 */
deviceTokenSchema.statics.deactivateAllUserTokens = function (userId) {
  return this.updateMany({ userId }, { $set: { isActive: false } });
};

/**
 * Get all active FCM tokens for a user (optionally filtered by platform)
 */
deviceTokenSchema.statics.getActiveTokens = function (userId, platform = null) {
  const query = { userId, isActive: true };
  if (platform) query.platform = platform;
  return this.find(query).select('token platform -_id');
};

const DeviceToken = mongoose.model('DeviceToken', deviceTokenSchema);

module.exports = DeviceToken;
