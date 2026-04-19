/**
 * features/notifications/notificationSlice.js
 * Redux Toolkit slice for notification state.
 * Mirrors the authSlice.js pattern — createAsyncThunk + extraReducers.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getNotificationsApi,
  getUnreadCountApi,
  markAsReadApi,
  markManyAsReadApi,
  markAllAsReadApi,
  deleteNotificationApi,
} from '../../api/notification.api';

// ── Initial state ─────────────────────────────────────────────────────────────

const initialState = {
  notifications: [],
  unreadCount: 0,

  // Pagination
  nextCursor: null,
  hasMore: true,

  // Loading states per operation
  isLoading: false,         // initial fetch
  isLoadingMore: false,     // load more (pagination)
  isMarkingRead: false,
  error: null,
};

// ── Async Thunks ──────────────────────────────────────────────────────────────

/**
 * Fetch first page of notifications (replaces existing list)
 */
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async ({ unreadOnly = false, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const { data } = await getNotificationsApi({ limit, unreadOnly });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch notifications.');
    }
  }
);

/**
 * Load next page (appends to existing list)
 */
export const loadMoreNotifications = createAsyncThunk(
  'notifications/loadMore',
  async ({ cursor, unreadOnly = false, limit = 20 }, { rejectWithValue }) => {
    try {
      const { data } = await getNotificationsApi({ limit, cursor, unreadOnly });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load more.');
    }
  }
);

/**
 * Fetch unread count only (lightweight — used by bell badge)
 */
export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await getUnreadCountApi();
      return data.data.count;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      await markAsReadApi(notificationId);
      return notificationId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to mark as read.');
    }
  }
);

export const markManyNotificationsRead = createAsyncThunk(
  'notifications/markManyRead',
  async (notificationIds, { rejectWithValue }) => {
    try {
      await markManyAsReadApi(notificationIds);
      return notificationIds;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to mark as read.');
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      await markAllAsReadApi();
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to mark all as read.');
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/delete',
  async (notificationId, { rejectWithValue }) => {
    try {
      await deleteNotificationApi(notificationId);
      return notificationId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete.');
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },

    /**
     * Optimistically add a real-time notification (e.g. from FCM foreground message)
     */
    addRealtimeNotification(state, { payload }) {
      state.notifications.unshift(payload);
      state.unreadCount += 1;
    },

    /**
     * Reset list (e.g. when switching unread filter)
     */
    resetNotifications(state) {
      state.notifications = [];
      state.nextCursor = null;
      state.hasMore = true;
    },
  },

  extraReducers: (builder) => {
    // ── Fetch notifications ────────────────────────────────────────────────
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.notifications = payload.data;
        state.nextCursor = payload.pagination.nextCursor;
        state.hasMore = payload.pagination.hasMore;
      })
      .addCase(fetchNotifications.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      });

    // ── Load more ──────────────────────────────────────────────────────────
    builder
      .addCase(loadMoreNotifications.pending, (state) => {
        state.isLoadingMore = true;
      })
      .addCase(loadMoreNotifications.fulfilled, (state, { payload }) => {
        state.isLoadingMore = false;
        // Append, deduplicating by _id
        const existingIds = new Set(state.notifications.map((n) => n._id));
        const newItems = payload.data.filter((n) => !existingIds.has(n._id));
        state.notifications.push(...newItems);
        state.nextCursor = payload.pagination.nextCursor;
        state.hasMore = payload.pagination.hasMore;
      })
      .addCase(loadMoreNotifications.rejected, (state) => {
        state.isLoadingMore = false;
      });

    // ── Unread count ───────────────────────────────────────────────────────
    builder.addCase(fetchUnreadCount.fulfilled, (state, { payload }) => {
      state.unreadCount = payload;
    });

    // ── Mark one read ──────────────────────────────────────────────────────
    builder.addCase(markNotificationRead.fulfilled, (state, { payload }) => {
      const n = state.notifications.find((n) => n._id === payload);
      if (n && !n.isRead) {
        n.isRead = true;
        n.readAt = new Date().toISOString();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    });

    // ── Mark many read ─────────────────────────────────────────────────────
    builder.addCase(markManyNotificationsRead.fulfilled, (state, { payload }) => {
      const ids = new Set(payload);
      let markedCount = 0;
      state.notifications.forEach((n) => {
        if (ids.has(n._id) && !n.isRead) {
          n.isRead = true;
          n.readAt = new Date().toISOString();
          markedCount++;
        }
      });
      state.unreadCount = Math.max(0, state.unreadCount - markedCount);
    });

    // ── Mark all read ──────────────────────────────────────────────────────
    builder.addCase(markAllNotificationsRead.fulfilled, (state) => {
      state.notifications.forEach((n) => {
        n.isRead = true;
        n.readAt = new Date().toISOString();
      });
      state.unreadCount = 0;
    });

    // ── Delete ─────────────────────────────────────────────────────────────
    builder.addCase(deleteNotification.fulfilled, (state, { payload }) => {
      const idx = state.notifications.findIndex((n) => n._id === payload);
      if (idx !== -1) {
        if (!state.notifications[idx].isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(idx, 1);
      }
    });
  },
});

export const { clearError, addRealtimeNotification, resetNotifications } =
  notificationSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectNotifications      = (state) => state.notifications.notifications;
export const selectUnreadCount        = (state) => state.notifications.unreadCount;
export const selectNotificationsLoading = (state) => state.notifications.isLoading;
export const selectLoadingMore        = (state) => state.notifications.isLoadingMore;
export const selectHasMore            = (state) => state.notifications.hasMore;
export const selectNextCursor         = (state) => state.notifications.nextCursor;
export const selectNotificationsError = (state) => state.notifications.error;

export default notificationSlice.reducer;
