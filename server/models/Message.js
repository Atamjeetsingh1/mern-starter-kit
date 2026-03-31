/**
 * models/Message.js
 * Individual chat messages — stored separately from Conversation
 * to support efficient cursor-based pagination.
 *
 * Delivery lifecycle: sent → delivered → seen
 */

const mongoose = require("mongoose");

const MESSAGE_STATUS = Object.freeze({
  SENT: "sent",
  DELIVERED: "delivered",
  SEEN: "seen",
});

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    type: {
      type: String,
      enum: ["image", "document", "video", "audio", "other"],
      default: "other",
    },
    name: { type: String, default: "" },
    size: { type: Number, default: 0 }, // bytes
  },
  { _id: false } // Embedded sub-doc — no own _id needed
);

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true, // Most queries filter by conversationId first
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      default: "",
      maxlength: [2000, "Message cannot exceed 2000 characters."],
    },

    attachments: {
      type: [attachmentSchema],
      default: [],
    },

    // Delivery tracking
    status: {
      type: String,
      enum: Object.values(MESSAGE_STATUS),
      default: MESSAGE_STATUS.SENT,
    },

    seenAt: {
      type: Date,
      default: null,
    },

    // Soft-delete support (optional — messages can be "deleted" without DB removal)
    deletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true, // createdAt used for pagination, updatedAt for status changes
    versionKey: false,
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────

/**
 * Primary query: "give me the last N messages in conversation X".
 * conversationId + createdAt desc covers both filtering and sorting.
 */
messageSchema.index({ conversationId: 1, createdAt: -1 });

/**
 * Used when marking messages as "seen":
 * filter by conversationId, receiver, and status != 'seen'.
 */
messageSchema.index({ conversationId: 1, receiver: 1, status: 1 });

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
module.exports.MESSAGE_STATUS = MESSAGE_STATUS;
