/**
 * hooks/useNotifications.js
 * Convenience hook — wraps notification Redux thunks.
 * Components use this instead of dispatching directly.
 */

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchNotifications,
  loadMoreNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markManyNotificationsRead,
  markAllNotificationsRead,
  deleteNotification,
  resetNotifications,
  selectNotifications,
  selectUnreadCount,
  selectNotificationsLoading,
  selectLoadingMore,
  selectHasMore,
  selectNextCursor,
  selectNotificationsError,
} from '../features/notifications/notificationSlice';

export function useNotifications() {
  const dispatch = useDispatch();

  const notifications    = useSelector(selectNotifications);
  const unreadCount      = useSelector(selectUnreadCount);
  const isLoading        = useSelector(selectNotificationsLoading);
  const isLoadingMore    = useSelector(selectLoadingMore);
  const hasMore          = useSelector(selectHasMore);
  const nextCursor       = useSelector(selectNextCursor);
  const error            = useSelector(selectNotificationsError);

  const fetch = useCallback(
    (options = {}) => dispatch(fetchNotifications(options)),
    [dispatch]
  );

  const loadMore = useCallback(
    (options = {}) => {
      if (!nextCursor || isLoadingMore) return;
      dispatch(loadMoreNotifications({ cursor: nextCursor, ...options }));
    },
    [dispatch, nextCursor, isLoadingMore]
  );

  const refreshCount = useCallback(
    () => dispatch(fetchUnreadCount()),
    [dispatch]
  );

  const markRead = useCallback(
    (id) => dispatch(markNotificationRead(id)),
    [dispatch]
  );

  const markManyRead = useCallback(
    (ids) => dispatch(markManyNotificationsRead(ids)),
    [dispatch]
  );

  const markAllRead = useCallback(
    () => dispatch(markAllNotificationsRead()),
    [dispatch]
  );

  const remove = useCallback(
    (id) => dispatch(deleteNotification(id)),
    [dispatch]
  );

  const reset = useCallback(
    () => dispatch(resetNotifications()),
    [dispatch]
  );

  return {
    notifications,
    unreadCount,
    isLoading,
    isLoadingMore,
    hasMore,
    nextCursor,
    error,
    fetch,
    loadMore,
    refreshCount,
    markRead,
    markManyRead,
    markAllRead,
    remove,
    reset,
  };
}
