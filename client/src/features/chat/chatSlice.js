/**
 * features/chat/chatSlice.js
 * Redux Toolkit slice for the entire chat system.
 *
 * State shape:
 *  conversations      — inbox list
 *  activeConvId       — currently open conversation
 *  messages           — messages keyed by conversationId
 *  hasMore            — pagination flag per conversation
 *  typingUsers        — Map<conversationId, userId[]>
 *  onlineUsers        — Set-like object of online userIds
 *  loading            — async state flags
 *  error              — last error message
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getConversationsApi,
  getOrCreateConversationApi,
  getMessagesApi,
} from "../../api/chat.api";

// ── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchConversations = createAsyncThunk(
  "chat/fetchConversations",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await getConversationsApi();
      return data.data.conversations;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load conversations.");
    }
  }
);

export const startConversation = createAsyncThunk(
  "chat/startConversation",
  async (receiverId, { rejectWithValue }) => {
    try {
      const { data } = await getOrCreateConversationApi(receiverId);
      return data.data.conversation;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to start conversation.");
    }
  }
);

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async ({ conversationId, params = {} }, { rejectWithValue }) => {
    try {
      const { data } = await getMessagesApi(conversationId, params);
      return { conversationId, ...data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load messages.");
    }
  }
);

// Load older messages (infinite scroll — prepend to existing list)
export const fetchMoreMessages = createAsyncThunk(
  "chat/fetchMoreMessages",
  async ({ conversationId, before }, { rejectWithValue }) => {
    try {
      const { data } = await getMessagesApi(conversationId, { before });
      return { conversationId, ...data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load more messages.");
    }
  }
);

// ── Initial state ─────────────────────────────────────────────────────────────

const initialState = {
  conversations: [],
  activeConvId: null,

  // messages[conversationId] = Message[]
  messages: {},

  // hasMore[conversationId] = boolean
  hasMore: {},

  // typingUsers[conversationId] = userId[]
  typingUsers: {},

  // onlineUsers[userId] = true
  onlineUsers: {},

  loading: {
    conversations: false,
    messages: false,
    moreMessages: false,
    startConversation: false,
  },
  error: null,
};

// ── Slice ─────────────────────────────────────────────────────────────────────

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    // ── Active conversation ──────────────────────────────────────────────────
    setActiveConversation(state, { payload: convId }) {
      state.activeConvId = convId;
    },

    // ── Real-time: incoming message (from socket) ────────────────────────────
    receiveMessage(state, { payload }) {
      const { message, conversationId } = payload;

      // Append to messages list (prevent duplicates)
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      const exists = state.messages[conversationId].some(
        (m) => m._id === message._id
      );
      if (!exists) {
        state.messages[conversationId].push(message);
      }

      // Update conversation's lastMessage preview
      const conv = state.conversations.find((c) => c._id === conversationId);
      if (conv) {
        conv.lastMessageText = message.text || "[Attachment]";
        conv.lastMessageAt = message.createdAt;
        // Increment unread only if this isn't the active conversation
        if (state.activeConvId !== conversationId) {
          const userId = message.receiver?._id || message.receiver;
          const key = String(userId);
          if (!conv.unreadCount) conv.unreadCount = {};
          conv.unreadCount[key] = (conv.unreadCount[key] || 0) + 1;
        }
      }
    },

    // ── Optimistic: add temp message before socket confirms ─────────────────
    addOptimisticMessage(state, { payload }) {
      const { conversationId, message } = payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      state.messages[conversationId].push(message);
    },

    // ── Replace optimistic message with server-confirmed message ────────────
    confirmMessage(state, { payload }) {
      const { conversationId, tempId, message } = payload;
      const msgs = state.messages[conversationId];
      if (!msgs) return;
      const idx = msgs.findIndex((m) => m._id === tempId);
      if (idx !== -1) msgs.splice(idx, 1, message);
    },

    // ── Message status update (delivered / seen) ─────────────────────────────
    updateMessageStatus(state, { payload }) {
      const { conversationId, messageId, status, seenAt } = payload;
      const msgs = state.messages[conversationId];
      if (!msgs) return;
      if (messageId) {
        // Single message update
        const msg = msgs.find((m) => m._id === messageId);
        if (msg) {
          msg.status = status;
          if (seenAt) msg.seenAt = seenAt;
        }
      } else {
        // Bulk update (all messages marked seen in a conversation)
        msgs.forEach((m) => {
          m.status = status;
          if (seenAt) m.seenAt = seenAt;
        });
      }
    },

    // ── Reset unread count locally after opening a conversation ─────────────
    clearUnread(state, { payload: { conversationId, userId } }) {
      const conv = state.conversations.find((c) => c._id === conversationId);
      if (conv?.unreadCount) {
        conv.unreadCount[String(userId)] = 0;
      }
    },

    // ── Typing indicators ────────────────────────────────────────────────────
    addTypingUser(state, { payload: { conversationId, userId } }) {
      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = [];
      }
      if (!state.typingUsers[conversationId].includes(userId)) {
        state.typingUsers[conversationId].push(userId);
      }
    },
    removeTypingUser(state, { payload: { conversationId, userId } }) {
      if (state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = state.typingUsers[
          conversationId
        ].filter((id) => id !== userId);
      }
    },

    // ── Online presence ───────────────────────────────────────────────────────
    setUserOnline(state, { payload: { userId } }) {
      state.onlineUsers[userId] = true;
    },
    setUserOffline(state, { payload: { userId } }) {
      delete state.onlineUsers[userId];
    },

    // ── Reset chat state (on logout) ──────────────────────────────────────────
    resetChat() {
      return initialState;
    },
  },

  extraReducers: (builder) => {
    // ── fetchConversations ───────────────────────────────────────────────────
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.loading.conversations = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, { payload }) => {
        state.loading.conversations = false;
        state.conversations = payload;
      })
      .addCase(fetchConversations.rejected, (state, { payload }) => {
        state.loading.conversations = false;
        state.error = payload;
      });

    // ── startConversation ────────────────────────────────────────────────────
    builder
      .addCase(startConversation.pending, (state) => {
        state.loading.startConversation = true;
      })
      .addCase(startConversation.fulfilled, (state, { payload }) => {
        state.loading.startConversation = false;
        // Add to inbox if not already present
        const exists = state.conversations.some((c) => c._id === payload._id);
        if (!exists) {
          state.conversations.unshift(payload);
        }
        state.activeConvId = payload._id;
      })
      .addCase(startConversation.rejected, (state, { payload }) => {
        state.loading.startConversation = false;
        state.error = payload;
      });

    // ── fetchMessages ─────────────────────────────────────────────────────────
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.loading.messages = true;
      })
      .addCase(fetchMessages.fulfilled, (state, { payload }) => {
        state.loading.messages = false;
        state.messages[payload.conversationId] = payload.messages;
        state.hasMore[payload.conversationId] = payload.hasMore;
      })
      .addCase(fetchMessages.rejected, (state, { payload }) => {
        state.loading.messages = false;
        state.error = payload;
      });

    // ── fetchMoreMessages (prepend older) ─────────────────────────────────────
    builder
      .addCase(fetchMoreMessages.pending, (state) => {
        state.loading.moreMessages = true;
      })
      .addCase(fetchMoreMessages.fulfilled, (state, { payload }) => {
        state.loading.moreMessages = false;
        const existing = state.messages[payload.conversationId] || [];
        // Prepend older messages, avoiding duplicates
        const existingIds = new Set(existing.map((m) => m._id));
        const newUnique = payload.messages.filter(
          (m) => !existingIds.has(m._id)
        );
        state.messages[payload.conversationId] = [...newUnique, ...existing];
        state.hasMore[payload.conversationId] = payload.hasMore;
      })
      .addCase(fetchMoreMessages.rejected, (state, { payload }) => {
        state.loading.moreMessages = false;
        state.error = payload;
      });
  },
});

export const {
  setActiveConversation,
  receiveMessage,
  addOptimisticMessage,
  confirmMessage,
  updateMessageStatus,
  clearUnread,
  addTypingUser,
  removeTypingUser,
  setUserOnline,
  setUserOffline,
  resetChat,
} = chatSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectConversations = (state) => state.chat.conversations;
export const selectActiveConvId = (state) => state.chat.activeConvId;
export const selectMessages = (convId) => (state) =>
  state.chat.messages[convId] || [];
export const selectHasMore = (convId) => (state) =>
  state.chat.hasMore[convId] ?? false;
export const selectTypingUsers = (convId) => (state) =>
  state.chat.typingUsers[convId] || [];
export const selectOnlineUsers = (state) => state.chat.onlineUsers;
export const selectChatLoading = (state) => state.chat.loading;

export default chatSlice.reducer;
