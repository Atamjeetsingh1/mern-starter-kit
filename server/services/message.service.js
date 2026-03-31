/**
 * services/message.service.js
 * Business logic for sending and retrieving messages.
 * Always updates the parent Conversation after saving a message.
 */

const Message = require("../models/Message");
const { updateConversationMeta } = require("./conversation.service");
const { MESSAGE_STATUS } = require("../models/Message");

/**
 * Save a message to the DB and update the Conversation's metadata.
 * This is Step 1 in the strict message flow:
 *   1. Save  →  2. Update conversation  →  3. Emit (done in socketManager)
 *
 * @param {{ conversationId, senderId, receiverId, text, attachments }} params
 * @returns {Message}
 */
const saveMessage = async ({
  conversationId,
  senderId,
  receiverId,
  text = "",
  attachments = [],
}) => {
  // 1. Persist message
  const message = await Message.create({
    conversationId,
    sender: senderId,
    receiver: receiverId,
    text,
    attachments,
    status: MESSAGE_STATUS.SENT,
  });

  // Populate sender for the socket payload
  await message.populate("sender", "name avatar");

  // 2. Update conversation metadata (denormalised fields + unreadCount)
  await updateConversationMeta(conversationId, message, receiverId);

  return message;
};

/**
 * Fetch messages for a conversation with cursor-based pagination.
 * Returns newest-first; the client reverses for display.
 *
 * @param {string} conversationId
 * @param {{ page: number, limit: number, before: string|null }} options
 * @returns {{ messages: Message[], hasMore: boolean }}
 */
const getMessages = async (
  conversationId,
  { page = 1, limit = 20, before = null } = {}
) => {
  const query = { conversationId };

  // If a cursor is provided, fetch messages older than that message ID
  if (before) {
    const cursorMsg = await Message.findById(before).select("createdAt");
    if (cursorMsg) {
      query.createdAt = { $lt: cursorMsg.createdAt };
    }
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1) // Fetch one extra to determine hasMore
    .populate("sender", "name avatar")
    .lean();

  const hasMore = messages.length > limit;
  if (hasMore) messages.pop(); // Remove the extra

  return { messages: messages.reverse(), hasMore }; // Oldest first for display
};

/**
 * Bulk-update messages to 'seen' status for a viewer.
 * Also sets seenAt timestamp.
 *
 * @param {string} conversationId
 * @param {string} viewerId  - The user who just read the messages
 * @returns {string[]} ids - Message IDs that were updated
 */
const markMessagesSeen = async (conversationId, viewerId) => {
  const now = new Date();

  const result = await Message.updateMany(
    {
      conversationId,
      receiver: viewerId,
      status: { $ne: MESSAGE_STATUS.SEEN },
    },
    {
      $set: { status: MESSAGE_STATUS.SEEN, seenAt: now },
    }
  );

  return result.modifiedCount;
};

/**
 * Mark messages as 'delivered' when the receiver comes online.
 *
 * @param {string} receiverId
 */
const markMessagesDelivered = async (receiverId) => {
  await Message.updateMany(
    { receiver: receiverId, status: MESSAGE_STATUS.SENT },
    { $set: { status: MESSAGE_STATUS.DELIVERED } }
  );
};

module.exports = {
  saveMessage,
  getMessages,
  markMessagesSeen,
  markMessagesDelivered,
};
