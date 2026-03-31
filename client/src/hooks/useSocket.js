/**
 * hooks/useSocket.js
 * Global socket lifecycle hook.
 *
 * - Connect/disconnect socket with user session
 * - Register global Socket.IO event listeners → dispatch Redux actions
 * - Must be mounted once at the app level (e.g. inside a protected route wrapper)
 */

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import socketClient from "../utils/socketClient";
import { CHAT_EVENTS } from "../constants";
import {
  receiveMessage,
  updateMessageStatus,
  addTypingUser,
  removeTypingUser,
  setUserOnline,
  setUserOffline,
} from "../features/chat/chatSlice";
import { selectIsAuthenticated } from "../features/auth/authSlice";

const useSocket = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  // Keep a ref to the socket so event handlers always have the latest instance
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      // User logged out — disconnect and clean up
      socketClient.disconnect();
      socketRef.current = null;
      return;
    }

    // Connect (or reuse existing connection)
    const socket = socketClient.connect();
    if (!socket) return;
    socketRef.current = socket;

    // ── Register real-time event listeners ───────────────────────────────────

    const onReceiveMessage = (payload) => {
      dispatch(receiveMessage(payload));
    };

    const onMessageStatusUpdate = (payload) => {
      dispatch(updateMessageStatus(payload));
    };

    const onTyping = ({ userId, conversationId }) => {
      dispatch(addTypingUser({ conversationId, userId }));
    };

    const onStopTyping = ({ userId, conversationId }) => {
      dispatch(removeTypingUser({ conversationId, userId }));
    };

    const onUserOnline = ({ userId }) => {
      dispatch(setUserOnline({ userId }));
    };

    const onUserOffline = ({ userId }) => {
      dispatch(setUserOffline({ userId }));
    };

    const onError = ({ message }) => {
      console.error("[Socket]", message);
    };

    socket.on(CHAT_EVENTS.RECEIVE_MESSAGE, onReceiveMessage);
    socket.on(CHAT_EVENTS.MESSAGE_STATUS_UPDATE, onMessageStatusUpdate);
    socket.on(CHAT_EVENTS.TYPING_INDICATOR, onTyping);
    socket.on(CHAT_EVENTS.STOP_TYPING_INDICATOR, onStopTyping);
    socket.on(CHAT_EVENTS.USER_ONLINE, onUserOnline);
    socket.on(CHAT_EVENTS.USER_OFFLINE, onUserOffline);
    socket.on(CHAT_EVENTS.ERROR, onError);

    // ── Cleanup: remove listeners only (don't disconnect — socket is global) ─
    return () => {
      socket.off(CHAT_EVENTS.RECEIVE_MESSAGE, onReceiveMessage);
      socket.off(CHAT_EVENTS.MESSAGE_STATUS_UPDATE, onMessageStatusUpdate);
      socket.off(CHAT_EVENTS.TYPING_INDICATOR, onTyping);
      socket.off(CHAT_EVENTS.STOP_TYPING_INDICATOR, onStopTyping);
      socket.off(CHAT_EVENTS.USER_ONLINE, onUserOnline);
      socket.off(CHAT_EVENTS.USER_OFFLINE, onUserOffline);
      socket.off(CHAT_EVENTS.ERROR, onError);
    };
  }, [isAuthenticated, dispatch]);

  return socketRef;
};

export default useSocket;
