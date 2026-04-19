/**
 * components/notifications/NotificationBell.jsx
 * Bell icon button with unread badge. Drop into your Topbar.
 * Polls for unread count every 60s when user is active.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../../features/auth/authSlice';
import { selectUnreadCount } from '../../features/notifications/notificationSlice';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationDropdown from './NotificationDropdown';

const POLL_INTERVAL_MS = 60_000; // 60 seconds

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const unreadCount = useSelector(selectUnreadCount);
  const { refreshCount } = useNotifications();

  // Initial count fetch
  useEffect(() => {
    if (isAuthenticated) refreshCount();
  }, [isAuthenticated, refreshCount]);

  // Poll for new notifications
  useEffect(() => {
    if (!isAuthenticated) return;
    const id = setInterval(refreshCount, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isAuthenticated, refreshCount]);

  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  const close  = useCallback(() => setIsOpen(false), []);

  if (!isAuthenticated) return null;

  return (
    <div className="relative">
      <button
        onClick={toggle}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`
          relative p-2 rounded-lg transition-colors
          ${isOpen
            ? 'bg-blue-50 text-blue-600'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
          }
        `}
      >
        <Bell size={20} />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="
              absolute -top-0.5 -right-0.5
              min-w-[18px] h-[18px] px-1
              flex items-center justify-center
              rounded-full text-[10px] font-bold leading-none
              bg-red-500 text-white
              ring-2 ring-white
            "
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationDropdown isOpen={isOpen} onClose={close} />
    </div>
  );
};

export default NotificationBell;
