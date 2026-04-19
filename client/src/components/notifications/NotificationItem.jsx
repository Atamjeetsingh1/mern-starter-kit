/**
 * components/notifications/NotificationItem.jsx
 * Single notification row — used in both dropdown and full page.
 */

import React, { memo } from 'react';
import {
  CheckCircle,
  AlertCircle,
  Calendar,
  Package,
  ShieldAlert,
  Bell,
  Trash2,
  Check,
} from 'lucide-react';

// ── Icon map per notification type ────────────────────────────────────────────

const TYPE_CONFIG = {
  WELCOME:             { icon: Bell,        color: 'text-blue-500',  bg: 'bg-blue-50' },
  EMAIL_VERIFIED:      { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
  PASSWORD_RESET:      { icon: ShieldAlert, color: 'text-orange-500',bg: 'bg-orange-50' },
  PASSWORD_CHANGED:    { icon: ShieldAlert, color: 'text-red-500',   bg: 'bg-red-50' },
  LOGIN_NEW_DEVICE:    { icon: ShieldAlert, color: 'text-red-500',   bg: 'bg-red-50' },
  BOOKING_CREATED:     { icon: Calendar,    color: 'text-indigo-500',bg: 'bg-indigo-50' },
  BOOKING_CONFIRMED:   { icon: Calendar,    color: 'text-green-500', bg: 'bg-green-50' },
  BOOKING_CANCELLED:   { icon: Calendar,    color: 'text-red-500',   bg: 'bg-red-50' },
  BOOKING_REMINDER:    { icon: Calendar,    color: 'text-yellow-500',bg: 'bg-yellow-50' },
  ORDER_SHIPPED:       { icon: Package,     color: 'text-blue-500',  bg: 'bg-blue-50' },
  ORDER_DELIVERED:     { icon: Package,     color: 'text-green-500', bg: 'bg-green-50' },
  SYSTEM_ANNOUNCEMENT: { icon: AlertCircle, color: 'text-gray-500',  bg: 'bg-gray-100' },
  ACCOUNT_SUSPENDED:   { icon: ShieldAlert, color: 'text-red-600',   bg: 'bg-red-50' },
};

const DEFAULT_CONFIG = { icon: Bell, color: 'text-gray-400', bg: 'bg-gray-100' };

// ── Time formatting ───────────────────────────────────────────────────────────

function formatRelativeTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1)  return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7)  return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Component ─────────────────────────────────────────────────────────────────

const NotificationItem = memo(function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
  compact = false, // true = dropdown, false = full page
}) {
  const { icon: Icon, color, bg } = TYPE_CONFIG[notification.type] ?? DEFAULT_CONFIG;

  const handleMarkRead = (e) => {
    e.stopPropagation();
    if (!notification.isRead) onMarkRead?.(notification._id);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(notification._id);
  };

  return (
    <div
      className={`
        group relative flex gap-3 px-4 py-3 transition-colors duration-150 cursor-default
        ${notification.isRead
          ? 'bg-white hover:bg-gray-50'
          : 'bg-blue-50/40 hover:bg-blue-50/60 border-l-2 border-blue-400'
        }
        ${compact ? 'py-3' : 'py-4'}
      `}
      onClick={handleMarkRead}
      role="article"
      aria-label={`Notification: ${notification.title}`}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 rounded-full p-2 h-9 w-9 flex items-center justify-center ${bg}`}>
        <Icon size={16} className={color} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium text-gray-900 leading-snug ${compact ? 'line-clamp-1' : ''}`}>
            {notification.title}
          </p>
          <span className="flex-shrink-0 text-xs text-gray-400 mt-0.5 whitespace-nowrap">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>

        <p className={`mt-0.5 text-sm text-gray-500 leading-snug ${compact ? 'line-clamp-2' : 'line-clamp-3'}`}>
          {notification.body}
        </p>

        {/* Unread dot */}
        {!notification.isRead && (
          <span className="inline-block mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
        )}
      </div>

      {/* Action buttons — visible on hover */}
      <div className="absolute right-3 top-3 hidden group-hover:flex items-center gap-1">
        {!notification.isRead && (
          <button
            onClick={handleMarkRead}
            title="Mark as read"
            className="p-1 rounded text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
          >
            <Check size={14} />
          </button>
        )}
        <button
          onClick={handleDelete}
          title="Delete"
          className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
});

export default NotificationItem;
