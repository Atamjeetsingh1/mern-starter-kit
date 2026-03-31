/**
 * routes/chat.routes.js
 * All chat REST endpoints.
 * Socket events are handled separately in sockets/socketManager.js.
 */

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const asyncHandler = require("../middleware/asyncHandler");
const chatController = require("../controllers/chat.controller");

// All chat routes require authentication
router.use(protect);

// ── Conversations ──────────────────────────────────────────────────────────

// GET  /api/v1/chat/conversations     → user's inbox
router.get("/conversations", asyncHandler(chatController.getConversations));

// POST /api/v1/chat/conversations     → find or create 1-to-1 conversation
router.post(
  "/conversations",
  asyncHandler(chatController.getOrCreateConversation)
);

// ── Messages ───────────────────────────────────────────────────────────────

// GET   /api/v1/chat/conversations/:conversationId/messages  → paginated history
router.get(
  "/conversations/:conversationId/messages",
  asyncHandler(chatController.getMessages)
);

// PATCH /api/v1/chat/conversations/:conversationId/read   → mark as seen
router.patch(
  "/conversations/:conversationId/read",
  asyncHandler(chatController.markRead)
);

module.exports = router;
