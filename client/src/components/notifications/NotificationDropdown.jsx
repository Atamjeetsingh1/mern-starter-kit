/**
 * components/notifications/NotificationDropdown.jsx
 * Popover dropdown with notification list.
 * Closes on outside click, Escape key, and route change.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellOff, ArrowRight, CheckCheck, Loader2 } from 'lucide-react';
import { ROUTES } from '../../constants';
import NotificationItem from './NotificationItem';
import { useNotifications } from '../../hooks/useNotifications';

const NotificationDropdown = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const ref = useRef(null);
  const {
    notifications,
    unreadCount,
    isLoading,
    markRead,
    markAllRead,
    remove,
    fetch,
  } = useNotifications();

  // Fetch on open
  useEffect(() => {
    if (isOpen) fetch({ limit: 10 });
  }, [isOpen, fetch]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleMarkAllRead = useCallback(async () => {
    await markAllRead();
  }, [markAllRead]);

  const handleViewAll = () => {
    navigate(ROUTES.NOTIFICATIONS);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Notifications"
      className="
        absolute right-0 top-full mt-2 w-96 z-50
        bg-white rounded-xl shadow-xl border border-gray-100
        overflow-hidden
        animate-in fade-in slide-in-from-top-2 duration-150
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">Notifications</span>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <CheckCheck size={13} />
            Mark all read
          </button>
        )}
      </div>

      {/* Body */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-gray-400" />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState />
        ) : (
          notifications.slice(0, 8).map((n) => (
            <NotificationItem
              key={n._id}
              notification={n}
              onMarkRead={markRead}
              onDelete={remove}
              compact
            />
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-100">
          <button
            onClick={handleViewAll}
            className="
              w-full flex items-center justify-center gap-1.5
              py-3 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50
              font-medium transition-colors
            "
          >
            View all notifications
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <BellOff size={20} className="text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-600">All caught up!</p>
      <p className="text-xs text-gray-400 mt-0.5">No new notifications</p>
    </div>
  );
}

export default NotificationDropdown;
