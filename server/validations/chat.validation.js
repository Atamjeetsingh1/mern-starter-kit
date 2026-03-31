/**
 * validations/chat.validation.js
 * Joi schemas for chat-related HTTP endpoints.
 * Socket payloads are validated inline in socketManager.js.
 */

const Joi = require("joi");

// ── Send / initiate message ────────────────────────────────────────────────

/**
 * POST /api/v1/chat/conversations
 * Start a conversation with another user.
 */
const startConversationSchema = Joi.object({
  receiverId: Joi.string()
    .pattern(/^[a-f\d]{24}$/i, "ObjectId") // MongoDB ObjectId
    .required()
    .messages({
      "string.pattern.name": "receiverId must be a valid user ID.",
      "any.required": "receiverId is required.",
    }),
});

/**
 * POST /api/v1/chat/conversations/:conversationId/messages  (HTTP fallback)
 * Primary send flow is via Socket.IO; this is a REST fallback.
 */
const sendMessageSchema = Joi.object({
  text: Joi.string().max(2000).allow("").default(""),
  attachments: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().uri().required(),
        type: Joi.string()
          .valid("image", "document", "video", "audio", "other")
          .default("other"),
        name: Joi.string().max(255).allow("").default(""),
        size: Joi.number().integer().min(0).default(0),
      })
    )
    .max(10)
    .default([]),
}).or("text", "attachments"); // At least one must be present

/**
 * GET /api/v1/chat/conversations/:conversationId/messages
 */
const getMessagesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  before: Joi.string()
    .pattern(/^[a-f\d]{24}$/i, "ObjectId")
    .optional(), // Cursor-based: load messages older than this ID
});

module.exports = {
  startConversationSchema,
  sendMessageSchema,
  getMessagesSchema,
};
