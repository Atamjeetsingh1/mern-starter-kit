/**
 * public/firebase-messaging-sw.js
 *
 * Service Worker for Firebase Cloud Messaging.
 * Handles background push notifications (when app is not in focus).
 *
 * IMPORTANT: This file MUST be in the /public folder (served from root).
 * Firebase requires it at /firebase-messaging-sw.js
 *
 * Replace the firebaseConfig values with your actual project values.
 * Do NOT use process.env here — service workers don't have access to it.
 */

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            'YOUR_API_KEY',
  authDomain:        'YOUR_AUTH_DOMAIN',
  projectId:         'YOUR_PROJECT_ID',
  storageBucket:     'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId:             'YOUR_APP_ID',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};
  const notificationOptions = {
    body: body ?? 'You have a new notification',
    icon: '/icons/notification-icon.png', // add this icon to /public/icons/
    badge: '/icons/badge-icon.png',
    data: payload.data,
    requireInteraction: false,
  };

  self.registration.showNotification(title ?? 'Notification', notificationOptions);
});

// Handle notification click — open app or specific page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url ?? '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
