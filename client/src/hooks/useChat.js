/**
 * hooks/useChat.js
 * Convenience hook for the ChatPage.
 *
 * Provides:
 *  - sendMessage(text)        — optimistic send via socket with DB ack
 *  - startTyping()            — debounced typing event
 *  - stopTyping()             — stop typing event
 *  - loadMoreMessages()       — infinite scroll trigger
 *  - openConversation(convId) — join room + fetch messages
 *  - All relevant Redux selectors
 */

import { useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import socketClient from "../utils/socketClient";
import { CHAT_EVENTS } from "../constants";
import {
  setActiveConversation,
  addOptimisticMessage,
  confirmMessage,
  clearUnread,
  fetchMessages,
  fetchMoreMessages,
  selectConversations,
  selectActiveConvId,
  selectMessages,
  selectHasMore,
  selectTypingUsers,
  selectOnlineUsers,
  selectChatLoading,
} from "../features/chat/chatSlice";
import { selectCurrentUser } from "../features/auth/authSlice";
import { markReadApi } from "../api/chat.api";

const TYPING_DEBOUNCE_MS = 1_000; // Stop typing after 1 s of inactivity

const useChat = (conversationId) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);

  // Selectors
  const conversations  = useSelector(selectConversations);
  const activeConvId   = useSelector(selectActiveConvId);
  const messages       = useSelector(selectMessages(conversationId));
  const hasMore        = useSelector(selectHasMore(conversationId));
  const typingUsers    = useSelector(selectTypingUsers(conversationId));
  const onlineUsers    = useSelector(selectOnlineUsers);
  const loading        = useSelector(selectChatLoading);

  const typingTimerRef = useRef(null);
  const isTypingRef    = useRef(false);

  // ── Open a conversation ──────────────────────────────────────────────────────
  const openConversation = useCallback(
    async (convId) => {
      const socket = socketClient.getSocket();
      if (!socket) return;

      // Leave previous room
      if (activeConvId && activeConvId !== convId) {
        socket.emit(CHAT_EVENTS.LEAVE_CONVERSATION, {
          conversationId: activeConvId,
        });
      }

      dispatch(setActiveConversation(convId));

      // Join new room
      socket.emit(CHAT_EVENTS.JOIN_CONVERSATION, { conversationId: convId });

      // Fetch messages if not cached
      dispatch(fetchMessages({ conversationId: convId }));

      // Mark as read (reset unread count)
      try {
        await markReadApi(convId);
        dispatch(clearUnread({ conversationId: convId, userId: currentUser?._id }));
        socket.emit(CHAT_EVENTS.MARK_SEEN, { conversationId: convId });
      } catch (_) {
        // Non-critical — don't block UI
      }
    },
    [activeConvId, currentUser, dispatch]
  );

  // ── Send a message ────────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    (text, attachments = []) => {
      if (!text.trim() && attachments.length === 0) return;
      if (!conversationId) return;

      const socket = socketClient.getSocket();
      if (!socket?.connected) return;

      // Find receiver from the active conversation
      const conversation = conversations.find((c) => c._id === conversationId);
      if (!conversation) return;

      const receiverParticipant = conversation.participants?.find(
        (p) =>
          String(p._id || p) !== String(currentUser?._id)
      );
      const receiverId = receiverParticipant?._id || receiverParticipant;
      if (!receiverId) return;

      // Optimistic message (temp ID prefixed so we can replace it later)
      const tempId = `temp_${Date.now()}`;
      const optimisticMsg = {
        _id: tempId,
        conversationId,
        sender: { _id: currentUser._id, name: currentUser.name, avatar: currentUser.avatar },
        receiver: receiverId,
        text: text.trim(),
        attachments,
        status: "sent",
        createdAt: new Date().toISOString(),
        isOptimistic: true,
      };

      dispatch(addOptimisticMessage({ conversationId, message: optimisticMsg }));

      // Stop typing indicator before sending
      stopTyping();

      // Emit to server — server saves to DB then emits back to the room
      socket.emit(
        CHAT_EVENTS.SEND_MESSAGE,
        { conversationId, receiverId, text: text.trim(), attachments },
        (ack) => {
          if (ack?.success && ack.message) {
            // Replace optimistic message with confirmed one
            dispatch(
              confirmMessage({ conversationId, tempId, message: ack.message })
            );
          } else {
            // On failure, mark optimistic message as failed
            dispatch(
              confirmMessage({
                conversationId,
                tempId,
                message: { ...optimisticMsg, _id: tempId, status: "failed" },
              })
            );
          }
        }
      );
    },
    [conversationId, conversations, currentUser, dispatch]
  );

  // ── Typing events ─────────────────────────────────────────────────────────────
  const startTyping = useCallback(() => {
    const socket = socketClient.getSocket();
    if (!socket || !conversationId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit(CHAT_EVENTS.TYPING, { conversationId });
    }

    // Auto-stop after debounce window with no further calls
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      stopTyping();
    }, TYPING_DEBOUNCE_MS);
  }, [conversationId]);

  const stopTyping = useCallback(() => {
    const socket = socketClient.getSocket();
    clearTimeout(typingTimerRef.current);
    if (isTypingRef.current && socket && conversationId) {
      isTypingRef.current = false;
      socket.emit(CHAT_EVENTS.STOP_TYPING, { conversationId });
    }
  }, [conversationId]);

  // ── Load more (infinite scroll) ───────────────────────────────────────────────
  const loadMoreMessages = useCallback(() => {
    if (!hasMore || loading.moreMessages || !conversationId) return;
    const oldestMessage = messages[0];
    if (!oldestMessage) return;
    dispatch(
      fetchMoreMessages({ conversationId, before: oldestMessage._id })
    );
  }, [conversationId, hasMore, loading.moreMessages, messages, dispatch]);

  return {
    conversations,
    activeConvId,
    messages,
    hasMore,
    typingUsers,
    onlineUsers,
    loading,
    sendMessage,
    startTyping,
    stopTyping,
    loadMoreMessages,
    openConversation,
  };
};

export default useChat;
