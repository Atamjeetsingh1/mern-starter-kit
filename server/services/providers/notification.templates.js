const { NOTIFICATION_TYPES } = require('../../constants/notification.types');

/**
 * notification.templates.js
 *
 * Maps notification types to title/body templates.
 * Templates receive the `data` payload and return { title, body }.
 *
 * Keep titles short (< 50 chars) — push notification truncates on lock screen.
 * Keep body concise (< 150 chars) for best UX on mobile.
 */

const templates = {
  [NOTIFICATION_TYPES.WELCOME]: ({ name }) => ({
    title: 'Welcome aboard! 🎉',
    body: `Hey ${name}, your account is ready. Let's get started.`,
  }),

  [NOTIFICATION_TYPES.EMAIL_VERIFIED]: () => ({
    title: 'Email Verified ✅',
    body: 'Your email has been verified successfully.',
  }),

  [NOTIFICATION_TYPES.PASSWORD_RESET]: () => ({
    title: 'Password Reset Requested',
    body: 'We received a request to reset your password. Check your email.',
  }),

  [NOTIFICATION_TYPES.PASSWORD_CHANGED]: () => ({
    title: 'Password Changed',
    body: "Your password was updated. If this wasn't you, contact support immediately.",
  }),

  [NOTIFICATION_TYPES.LOGIN_NEW_DEVICE]: ({ platform }) => ({
    title: 'New Login Detected',
    body: `A new ${platform ?? 'device'} just signed into your account.`,
  }),

  [NOTIFICATION_TYPES.BOOKING_CREATED]: ({ bookingId }) => ({
    title: 'Booking Confirmed 📅',
    body: `Your booking #${bookingId} has been created successfully.`,
  }),

  [NOTIFICATION_TYPES.BOOKING_CONFIRMED]: ({ bookingId }) => ({
    title: 'Booking Approved ✅',
    body: `Great news! Booking #${bookingId} has been confirmed.`,
  }),

  [NOTIFICATION_TYPES.BOOKING_CANCELLED]: ({ bookingId }) => ({
    title: 'Booking Cancelled',
    body: `Booking #${bookingId} has been cancelled.`,
  }),

  [NOTIFICATION_TYPES.BOOKING_REMINDER]: ({ bookingId, time }) => ({
    title: 'Upcoming Booking ⏰',
    body: `Reminder: Booking #${bookingId} is scheduled for ${time}.`,
  }),

  [NOTIFICATION_TYPES.ORDER_SHIPPED]: ({ orderId }) => ({
    title: 'Order Shipped 🚚',
    body: `Your order #${orderId} is on its way!`,
  }),

  [NOTIFICATION_TYPES.ORDER_DELIVERED]: ({ orderId }) => ({
    title: 'Order Delivered 📦',
    body: `Order #${orderId} has been delivered. Enjoy!`,
  }),

  [NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT]: ({ message }) => ({
    title: 'System Notice',
    body: message ?? 'There is a new update from the team.',
  }),

  [NOTIFICATION_TYPES.ACCOUNT_SUSPENDED]: () => ({
    title: 'Account Suspended',
    body: 'Your account has been suspended. Contact support for assistance.',
  }),
};

/**
 * Resolve a template for a given type + data payload.
 * Falls back to a safe generic template if type is unmapped.
 *
 * @param {string} type - NOTIFICATION_TYPES value
 * @param {object} data - Domain payload for template interpolation
 * @returns {{ title: string, body: string }}
 */
function resolveTemplate(type, data = {}) {
  const templateFn = templates[type];

  if (!templateFn) {
    // Graceful fallback — never throw on missing template
    return {
      title: 'New Notification',
      body: 'You have a new update.',
    };
  }

  return templateFn(data);
}

module.exports = {
  resolveTemplate,
};
