/**
 * pages/NotificationsPage.jsx
 * Full notifications page with:
 * - Unread / All filter tabs
 * - Infinite scroll (cursor-based)
 * - Bulk mark all read
 * - Empty, loading, and error states
 * - Accessible markup
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { BellOff, CheckCheck, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import NotificationItem from '../components/notifications/NotificationItem';

const TABS = [
  { label: 'All',    value: false },
  { label: 'Unread', value: true  },
];

const NotificationsPage = () => {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const loaderRef = useRef(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    fetch,
    loadMore,
    markRead,
    markAllRead,
    remove,
    reset,
  } = useNotifications();

  // Fetch on mount and when filter changes
  useEffect(() => {
    reset();
    fetch({ unreadOnly });
  }, [unreadOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Infinite scroll via IntersectionObserver ──────────────────────────────
  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore({ unreadOnly });
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore, unreadOnly]);

  const handleTabChange = useCallback((val) => {
    if (val === unreadOnly) return;
    setUnreadOnly(val);
  }, [unreadOnly]);

  const handleMarkAllRead = useCallback(async () => {
    await markAllRead();
  }, [markAllRead]);

  const handleRetry = useCallback(() => {
    fetch({ unreadOnly });
  }, [fetch, unreadOnly]);

  return (
    <div className="max-w-2xl mx-auto">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="
              flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
              text-blue-600 bg-blue-50 hover:bg-blue-100
              transition-colors
            "
          >
            <CheckCheck size={15} />
            Mark all read
          </button>
        )}
      </div>

      {/* ── Filter tabs ──────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => handleTabChange(tab.value)}
            className={`
              px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
              ${unreadOnly === tab.value
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {tab.label}
            {tab.value && unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-600 font-medium">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Error state */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
              <AlertCircle size={20} className="text-red-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">Failed to load notifications</p>
            <p className="text-xs text-gray-400 mt-0.5 mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
            >
              <RefreshCw size={14} />
              Try again
            </button>
          </div>
        )}

        {/* Initial loading */}
        {isLoading && !error && (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonItem key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <BellOff size={22} className="text-gray-400" />
            </div>
            <p className="text-base font-medium text-gray-700">
              {unreadOnly ? 'No unread notifications' : 'No notifications yet'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {unreadOnly
                ? "You're all caught up! Switch to All to see your history."
                : "We'll notify you when something important happens."}
            </p>
          </div>
        )}

        {/* Notification list */}
        {!isLoading && !error && notifications.length > 0 && (
          <div
            role="list"
            aria-label="Notifications list"
            className="divide-y divide-gray-50"
          >
            {notifications.map((n) => (
              <div key={n._id} role="listitem">
                <NotificationItem
                  notification={n}
                  onMarkRead={markRead}
                  onDelete={remove}
                  compact={false}
                />
              </div>
            ))}
          </div>
        )}

        {/* Infinite scroll trigger */}
        <div ref={loaderRef} className="h-1" aria-hidden="true" />

        {/* Load more spinner */}
        {isLoadingMore && (
          <div className="flex justify-center py-4">
            <Loader2 size={18} className="animate-spin text-gray-400" />
          </div>
        )}

        {/* End of list */}
        {!isLoading && !hasMore && notifications.length > 0 && (
          <p className="text-center text-xs text-gray-400 py-4">
            You've reached the end
          </p>
        )}
      </div>
    </div>
  );
};

// ── Skeleton loader ───────────────────────────────────────────────────────────

function SkeletonItem() {
  return (
    <div className="flex gap-3 px-4 py-4 animate-pulse">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <div className="h-3.5 bg-gray-200 rounded w-2/5" />
          <div className="h-3 bg-gray-200 rounded w-10" />
        </div>
        <div className="h-3 bg-gray-200 rounded w-4/5" />
        <div className="h-3 bg-gray-200 rounded w-3/5" />
      </div>
    </div>
  );
}

export default NotificationsPage;
