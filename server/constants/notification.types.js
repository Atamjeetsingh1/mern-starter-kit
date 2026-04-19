/**
 * notification.types.js
 *
 * Single source of truth for all notification type strings.
 * Add new types here — the service validates against this list.
 *
 * Convention: DOMAIN_EVENT (screaming snake case)
 */

const NOTIFICATION_TYPES = Object.freeze({
  // ─── Auth ──────────────────────────────────────────────
  WELCOME:                'WELCOME',
  EMAIL_VERIFIED:         'EMAIL_VERIFIED',
  PASSWORD_RESET:         'PASSWORD_RESET',
  PASSWORD_CHANGED:       'PASSWORD_CHANGED',
  LOGIN_NEW_DEVICE:       'LOGIN_NEW_DEVICE',

  // ─── Booking / Orders ──────────────────────────────────
  BOOKING_CREATED:        'BOOKING_CREATED',
  BOOKING_CONFIRMED:      'BOOKING_CONFIRMED',
  BOOKING_CANCELLED:      'BOOKING_CANCELLED',
  BOOKING_REMINDER:       'BOOKING_REMINDER',
  ORDER_SHIPPED:          'ORDER_SHIPPED',
  ORDER_DELIVERED:        'ORDER_DELIVERED',

  // ─── System ────────────────────────────────────────────
  SYSTEM_ANNOUNCEMENT:    'SYSTEM_ANNOUNCEMENT',
  ACCOUNT_SUSPENDED:      'ACCOUNT_SUSPENDED',
});

const VALID_TYPES = new Set(Object.values(NOTIFICATION_TYPES));

module.exports = {
  NOTIFICATION_TYPES,
  VALID_TYPES,
};
