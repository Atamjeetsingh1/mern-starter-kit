/**
 * api/chat.api.js
 * HTTP API calls for the chat system.
 * Uses the existing axiosInstance (auto token injection + refresh).
 */

import axiosInstance from "./axiosInstance";

const BASE = "/chat";

/**
 * Fetch the authenticated user's conversation inbox.
 * @param {{ page: number, limit: number }} params
 */
export const getConversationsApi = (params = {}) =>
  axiosInstance.get(`${BASE}/conversations`, { params });

/**
 * Find or create a 1-to-1 conversation with another user.
 * @param {string} receiverId
 */
export const getOrCreateConversationApi = (receiverId) =>
  axiosInstance.post(`${BASE}/conversations`, { receiverId });

/**
 * Get paginated messages for a conversation.
 * @param {string} conversationId
 * @param {{ page: number, limit: number, before: string }} params
 */
export const getMessagesApi = (conversationId, params = {}) =>
  axiosInstance.get(`${BASE}/conversations/${conversationId}/messages`, {
    params,
  });

/**
 * Mark all messages in a conversation as seen + reset unread count.
 * @param {string} conversationId
 */
export const markReadApi = (conversationId) =>
  axiosInstance.patch(`${BASE}/conversations/${conversationId}/read`);
