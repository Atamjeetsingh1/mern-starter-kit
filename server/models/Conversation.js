/**
 * models/Conversation.js
 * Represents a 1-to-1 chat thread between two users.
 * Messages are stored separately (no embedding) to support pagination.
 */

const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    // Exactly two participants — sorted on creation to ensure uniqueness
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    // Denormalised fields so the inbox list never needs to query Messages
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    lastMessageText: {
      type: String,
      default: "",
      maxlength: 200, // Truncated preview
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },

    /**
     * unreadCount — Map keyed by userId (as string).
     * Persisted as a BSON Mixed/Map in MongoDB.
     * Example: { "64abc...": 3, "64def...": 0 }
     */
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────

// Fast participant lookup + uniqueness enforcement for a 1-to-1 pair
conversationSchema.index({ participants: 1 });

// Inbox query: conversations for a user ordered by most recent message
conversationSchema.index({ participants: 1, lastMessageAt: -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);

module.exports = Conversation;
