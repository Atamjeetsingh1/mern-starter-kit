/**
 * utils/socketClient.js
 * Singleton Socket.IO client.
 *
 * - Creates exactly one socket per session
 * - Passes the stored JWT as auth token
 * - Reconnects automatically (Socket.IO built-in)
 * - Call connect() when user logs in, disconnect() when user logs out
 */

import { io } from "socket.io-client";
import { getAccessToken } from "./storage";

const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL ||
  process.env.REACT_APP_API_BASE_URL?.replace("/api/v1", "") ||
  "http://localhost:5000";

let socket = null;

/**
 * Get (or create) the singleton socket instance.
 * Lazily initialised so the token is fresh at connection time.
 */
const getSocket = () => socket;

/**
 * Connect to the server. Should be called once after login.
 */
const connect = () => {
  if (socket?.connected) return socket;

  const token = getAccessToken();
  if (!token) {
    console.warn("[SocketClient] No access token — skipping connection.");
    return null;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 10_000,
    timeout: 20_000,
    withCredentials: true,
  });

  socket.on("connect", () => {
    console.info("[SocketClient] Connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.info("[SocketClient] Disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("[SocketClient] Connection error:", err.message);
  });

  return socket;
};

/**
 * Disconnect and null out the socket instance.
 * Should be called on logout to prevent memory leaks.
 */
const disconnect = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.info("[SocketClient] Disconnected manually.");
  }
};

export default { connect, disconnect, getSocket };
