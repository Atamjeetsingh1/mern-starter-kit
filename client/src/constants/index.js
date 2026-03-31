/**
 * constants/index.js
 * Front-end constants — mirrors some backend values to avoid magic strings.
 */

export const USER_ROLES = Object.freeze({
  CUSTOMER: "customer",
  PROVIDER: "provider",
  ADMIN:    "admin",
});

export const STORAGE_KEYS = Object.freeze({
  ACCESS_TOKEN:  "accessToken",
  REFRESH_TOKEN: "refreshToken",
  USER:          "user",
});

export const ROUTES = Object.freeze({
  HOME:         "/",
  LOGIN:        "/login",
  REGISTER:     "/register",
  DASHBOARD:    "/dashboard",
  PROFILE:      "/profile",
  CHAT:         "/chat",
  UNAUTHORIZED: "/unauthorized",
});

// Socket.IO event names — must match server/constants/index.js CHAT_EVENTS
export const CHAT_EVENTS = Object.freeze({
  JOIN_CONVERSATION:      "join_conversation",
  LEAVE_CONVERSATION:     "leave_conversation",
  SEND_MESSAGE:           "send_message",
  TYPING:                 "typing",
  STOP_TYPING:            "stop_typing",
  MARK_SEEN:              "mark_seen",
  RECEIVE_MESSAGE:        "receive_message",
  MESSAGE_STATUS_UPDATE:  "message_status_update",
  USER_ONLINE:            "user_online",
  USER_OFFLINE:           "user_offline",
  TYPING_INDICATOR:       "typing_indicator",
  STOP_TYPING_INDICATOR:  "stop_typing_indicator",
  ERROR:                  "chat_error",
});