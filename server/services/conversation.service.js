/**
 * services/conversation.service.js
 * Business logic for conversation management.
 * No DB logic lives in controllers — it all lives here.
 */

const Conversation = require("../models/Conversation");
const AppError = require("../utils/AppError");
const { HTTP_STATUS, MESSAGES } = require("../constants");

/**
 * Find an existing 1-to-1 conversation or create one.
 * Participants are sorted so [A,B] and [B,A] always map to the same document.
 *
 * @param {string} userAId
 * @param {string} userBId
 * @returns {Conversation}
 */
const findOrCreateConversation = async (userAId, userBId) => {
  if (String(userAId) === String(userBId)) {
    throw new AppError("Cannot chat with yourself.", HTTP_STATUS.BAD_REQUEST);
  }

  // Sort IDs to guarantee a canonical participant order
  const participants = [userAId, userBId].sort();

  let conversation = await Conversation.findOne({
    participants: { $all: participants },
  }).populate("lastMessage");

  if (!conversation) {
    conversation = await Conversation.create({ participants });
  }

  return conversation;
};

/**
 * Get all conversations for a user, sorted by most recent message.
 *
 * @param {string} userId
 * @param {{ page: number, limit: number }} options
 * @returns {{ conversations: Conversation[], total: number }}
 */
const getUserConversations = async (userId, { page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;

  const [conversations, total] = await Promise.all([
    Conversation.find({ participants: userId })
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("participants", "name avatar")
      .populate("lastMessage", "text status createdAt"),
    Conversation.countDocuments({ participants: userId }),
  ]);

  return { conversations, total };
};

/**
 * Get a single conversation by ID, verifying the requester is a participant.
 *
 * @param {string} conversationId
 * @param {string} userId
 * @returns {Conversation}
 */
const getConversationById = async (conversationId, userId) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  }).populate("participants", "name avatar");

  if (!conversation) {
    throw new AppError(MESSAGES.CONVERSATION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  return conversation;
};

/**
 * Reset the unread count for a specific user in a conversation.
 *
 * @param {string} conversationId
 * @param {string} userId
 */
const markConversationRead = async (conversationId, userId) => {
  await Conversation.findByIdAndUpdate(conversationId, {
    $set: { [`unreadCount.${userId}`]: 0 },
  });
};

/**
 * Update denormalised lastMessage fields and increment receiver's unread count.
 * Called only from message.service.js after a message is saved.
 *
 * @param {string} conversationId
 * @param {object} message  - Saved Message document
 * @param {string} receiverId
 */
const updateConversationMeta = async (conversationId, message, receiverId) => {
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: message._id,
    lastMessageText: message.text
      ? message.text.substring(0, 200)
      : "[Attachment]",
    lastMessageAt: message.createdAt,
    $inc: { [`unreadCount.${receiverId}`]: 1 },
  });
};

module.exports = {
  findOrCreateConversation,
  getUserConversations,
  getConversationById,
  markConversationRead,
  updateConversationMeta,
};
