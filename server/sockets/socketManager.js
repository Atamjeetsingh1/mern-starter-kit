/**
 * sockets/socketManager.js
 * Core Socket.IO event hub.
 *
 * Architecture:
 *  - In-memory Map for userId → socketId (online state)
 *  - Conversation rooms for targeted delivery
 *  - Strict message flow: DB save → conversation update → emit
 *  - Rate limiting per socket to prevent flooding
 *  - Graceful cleanup on disconnect
 */

const { CHAT_EVENTS } = require("../constants");
const messageService = require("../services/message.service");
const conversationService = require("../services/conversation.service");
const logger = require("../utils/logger");

// ── In-memory online map ───────────────────────────────────────────────────
// Map<userId: string, Set<socketId: string>>
// Using a Set supports multiple tabs/devices per user.
const onlineUsers = new Map();

const addOnlineUser = (userId, socketId) => {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socketId);
};

const removeOnlineUser = (userId, socketId) => {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) {
    onlineUsers.delete(userId); // User fully offline
  }
};

const isUserOnline = (userId) => {
  return onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;
};

// ── Per-socket rate limiting ───────────────────────────────────────────────
const RATE_LIMIT_WINDOW = 10_000; // 10 seconds
const RATE_LIMIT_MAX = 30;        // max events per window

const rateLimitMap = new Map(); // Map<socketId, { count, resetAt }>

const checkRateLimit = (socketId) => {
  const now = Date.now();
  const record = rateLimitMap.get(socketId) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };

  if (now > record.resetAt) {
    // Window expired — reset
    record.count = 1;
    record.resetAt = now + RATE_LIMIT_WINDOW;
  } else {
    record.count += 1;
  }

  rateLimitMap.set(socketId, record);
  return record.count <= RATE_LIMIT_MAX;
};

// ── Main factory ───────────────────────────────────────────────────────────

/**
 * Initialise all socket event listeners.
 * Call once after creating the io server: getSocketManager(io)
 *
 * @param {import("socket.io").Server} io
 */
const getSocketManager = (io) => {
  io.on("connection", async (socket) => {
    const userId = socket.data.userId;
    logger.info(`Socket connected: ${socket.id} (user: ${userId})`);

    // 1. Register user as online
    addOnlineUser(userId, socket.id);

    // 2. Mark pending messages as delivered now that the user is online
    try {
      await messageService.markMessagesDelivered(userId);
    } catch (err) {
      logger.error("markMessagesDelivered error:", err);
    }

    // 3. Notify other users that this user is online
    socket.broadcast.emit(CHAT_EVENTS.USER_ONLINE, { userId });

    // ── Event: join_conversation ─────────────────────────────────────────
    socket.on(CHAT_EVENTS.JOIN_CONVERSATION, async (data) => {
      try {
        const { conversationId } = data || {};
        if (!conversationId) return;

        // Verify the user is a participant before joining the room
        await conversationService.getConversationById(conversationId, userId);

        socket.join(conversationId);
        logger.info(`User ${userId} joined room: ${conversationId}`);
      } catch (err) {
        socket.emit(CHAT_EVENTS.ERROR, { message: err.message });
      }
    });

    // ── Event: leave_conversation ────────────────────────────────────────
    socket.on(CHAT_EVENTS.LEAVE_CONVERSATION, ({ conversationId } = {}) => {
      if (conversationId) socket.leave(conversationId);
    });

    // ── Event: send_message ──────────────────────────────────────────────
    /**
     * STRICT ORDER:
     *  1. Validate payload
     *  2. Save message to DB (via service)
     *  3. Update conversation metadata (done inside saveMessage)
     *  4. Emit to conversation room
     *  5. Emit delivery status if receiver is online
     */
    socket.on(CHAT_EVENTS.SEND_MESSAGE, async (data, ack) => {
      // Rate limit check
      if (!checkRateLimit(socket.id)) {
        const errMsg = "Rate limit exceeded. Slow down.";
        socket.emit(CHAT_EVENTS.ERROR, { message: errMsg });
        if (typeof ack === "function") ack({ success: false, message: errMsg });
        return;
      }

      try {
        const { conversationId, receiverId, text = "", attachments = [] } = data || {};

        // Basic validation
        if (!conversationId || !receiverId) {
          throw new Error("conversationId and receiverId are required.");
        }
        if (!text.trim() && attachments.length === 0) {
          throw new Error("Message must have text or an attachment.");
        }
        if (text.length > 2000) {
          throw new Error("Message text cannot exceed 2000 characters.");
        }

        // Step 1 + 2: Save message & update conversation
        const message = await messageService.saveMessage({
          conversationId,
          senderId: userId,
          receiverId,
          text: text.trim(),
          attachments,
        });

        // Step 3: Emit to all participants in the room
        io.to(conversationId).emit(CHAT_EVENTS.RECEIVE_MESSAGE, {
          message,
          conversationId,
        });

        // Step 4: Acknowledge sender
        if (typeof ack === "function") {
          ack({ success: true, message });
        }

        // Step 5: If receiver is online in the room, messages become 'delivered'
        // (socket auto-handles this via presence — full seen is handled by mark_seen)
        if (isUserOnline(receiverId)) {
          socket.emit(CHAT_EVENTS.MESSAGE_STATUS_UPDATE, {
            messageId: message._id,
            status: "delivered",
          });
        }
      } catch (err) {
        logger.error("send_message error:", err);
        socket.emit(CHAT_EVENTS.ERROR, { message: err.message });
        if (typeof ack === "function") ack({ success: false, message: err.message });
      }
    });

    // ── Event: typing ────────────────────────────────────────────────────
    socket.on(CHAT_EVENTS.TYPING, ({ conversationId } = {}) => {
      if (!conversationId || !checkRateLimit(socket.id)) return;
      socket.to(conversationId).emit(CHAT_EVENTS.TYPING_INDICATOR, {
        userId,
        conversationId,
      });
    });

    // ── Event: stop_typing ───────────────────────────────────────────────
    socket.on(CHAT_EVENTS.STOP_TYPING, ({ conversationId } = {}) => {
      if (!conversationId) return;
      socket.to(conversationId).emit(CHAT_EVENTS.STOP_TYPING_INDICATOR, {
        userId,
        conversationId,
      });
    });

    // ── Event: mark_seen ─────────────────────────────────────────────────
    socket.on(CHAT_EVENTS.MARK_SEEN, async ({ conversationId } = {}) => {
      if (!conversationId) return;
      try {
        await Promise.all([
          messageService.markMessagesSeen(conversationId, userId),
          conversationService.markConversationRead(conversationId, userId),
        ]);

        // Notify the sender(s) in the room that messages were seen
        socket.to(conversationId).emit(CHAT_EVENTS.MESSAGE_STATUS_UPDATE, {
          conversationId,
          status: "seen",
          seenBy: userId,
          seenAt: new Date().toISOString(),
        });
      } catch (err) {
        logger.error("mark_seen error:", err);
      }
    });

    // ── Disconnect ───────────────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (user: ${userId}) — ${reason}`);

      removeOnlineUser(userId, socket.id);
      rateLimitMap.delete(socket.id);

      // Only broadcast offline if the user has no other connected sockets
      if (!isUserOnline(userId)) {
        socket.broadcast.emit(CHAT_EVENTS.USER_OFFLINE, { userId });
      }
    });

    // ── Error handler ────────────────────────────────────────────────────
    socket.on("error", (err) => {
      logger.error(`Socket error (${socket.id}):`, err);
    });
  });

  // Expose helper for other parts of the server (e.g. HTTP routes triggering socket events)
  return { onlineUsers, isUserOnline };
};

module.exports = { getSocketManager, isUserOnline };
