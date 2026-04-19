/**
 * api/notification.api.js
 * All HTTP calls for the notification endpoints.
 * Follows the same pattern as auth.api.js — axiosInstance only, no direct axios.
 */

import axiosInstance from './axiosInstance';

// ─── Notifications ────────────────────────────────────────────────────────────

/**
 * Fetch paginated notifications
 * @param {{ limit?: number, cursor?: string, unreadOnly?: boolean }} params
 */
export const getNotificationsApi = (params = {}) =>
  axiosInstance.get('/notifications', { params });

/**
 * Get unread notification count (for bell badge)
 */
export const getUnreadCountApi = () =>
  axiosInstance.get('/notifications/unread-count');

/**
 * Mark a single notification as read
 * @param {string} id
 */
export const markAsReadApi = (id) =>
  axiosInstance.patch(`/notifications/${id}/read`);

/**
 * Mark multiple notifications as read
 * @param {string[]} notificationIds
 */
export const markManyAsReadApi = (notificationIds) =>
  axiosInstance.patch('/notifications/read-many', { notificationIds });

/**
 * Mark all notifications as read
 */
export const markAllAsReadApi = () =>
  axiosInstance.patch('/notifications/read-all');

/**
 * Delete a notification
 * @param {string} id
 */
export const deleteNotificationApi = (id) =>
  axiosInstance.delete(`/notifications/${id}`);

// ─── Device Tokens ────────────────────────────────────────────────────────────

/**
 * Register FCM device token (call after login / on app load)
 * @param {{ token: string, platform: 'web'|'android'|'ios', deviceInfo?: object }} data
 */
export const registerDeviceTokenApi = (data) =>
  axiosInstance.post('/notifications/device-token', data);

/**
 * Remove FCM device token (call on logout)
 * @param {string} token
 */
export const removeDeviceTokenApi = (token) =>
  axiosInstance.delete('/notifications/device-token', { data: { token } });
