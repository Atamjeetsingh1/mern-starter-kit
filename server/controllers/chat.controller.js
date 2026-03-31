/**
 * controllers/chat.controller.js
 * Thin HTTP layer — delegates all logic to services.
 * Validates input via Joi schemas, calls service, sends consistent response.
 */

const conversationService = require("../services/conversation.service");
const messageService = require("../services/message.service");
const { sendSuccess } = require("../utils/apiResponse");
const { HTTP_STATUS, MESSAGES } = require("../constants");
const {
  startConversationSchema,
  getMessagesSchema,
} = require("../validations/chat.validation");
const AppError = require("../utils/AppError");

// ── Conversations ──────────────────────────────────────────────────────────

/**
 * GET /api/v1/chat/conversations
 * Returns the authenticated user's inbox.
 */
const getConversations = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const { conversations, total } =
    await conversationService.getUserConversations(req.user.id, {
      page,
      limit,
    });

  return sendSuccess(
    res,
    HTTP_STATUS.OK,
    MESSAGES.CONVERSATIONS_FETCHED,
    { conversations },
    { page, limit, total, pages: Math.ceil(total / limit) }
  );
};

/**
 * POST /api/v1/chat/conversations
 * Find or create a 1-to-1 conversation with another user.
 */
const getOrCreateConversation = async (req, res) => {
  const { error, value } = startConversationSchema.validate(req.body);
  if (error) {
    throw new AppError(
      error.details[0].message,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const conversation = await conversationService.findOrCreateConversation(
    req.user.id,
    value.receiverId
  );

  return sendSuccess(
    res,
    HTTP_STATUS.OK,
    MESSAGES.CONVERSATION_CREATED,
    { conversation }
  );
};

// ── Messages ───────────────────────────────────────────────────────────────

/**
 * GET /api/v1/chat/conversations/:conversationId/messages
 * Paginated message history for a conversation.
 */
const getMessages = async (req, res) => {
  const { error, value } = getMessagesSchema.validate(req.query);
  if (error) {
    throw new AppError(
      error.details[0].message,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // Verify the requester is a participant
  await conversationService.getConversationById(
    req.params.conversationId,
    req.user.id
  );

  const { messages, hasMore } = await messageService.getMessages(
    req.params.conversationId,
    value
  );

  return sendSuccess(
    res,
    HTTP_STATUS.OK,
    MESSAGES.MESSAGES_FETCHED,
    { messages, hasMore }
  );
};

/**
 * PATCH /api/v1/chat/conversations/:conversationId/read
 * Mark all messages in a conversation as seen + reset unread count.
 */
const markRead = async (req, res) => {
  // Verify participant access
  await conversationService.getConversationById(
    req.params.conversationId,
    req.user.id
  );

  await Promise.all([
    messageService.markMessagesSeen(
      req.params.conversationId,
      req.user.id
    ),
    conversationService.markConversationRead(
      req.params.conversationId,
      req.user.id
    ),
  ]);

  return sendSuccess(res, HTTP_STATUS.OK, MESSAGES.CONVERSATION_READ);
};

module.exports = {
  getConversations,
  getOrCreateConversation,
  getMessages,
  markRead,
};
