/**
 * hooks/useFCMToken.js
 * Handles FCM permission request, token generation, and backend registration.
 * Call this once after login — it's idempotent (safe to call multiple times).
 */

import { useEffect, useCallback, useRef } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { useDispatch } from 'react-redux';
import { getMessagingInstance } from '../config/firebase';
import { registerDeviceTokenApi } from '../api/notification.api';
import { addRealtimeNotification, fetchUnreadCount } from '../features/notifications/notificationSlice';
import { useToast } from './useToast'; // your existing hook

const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY;
const FCM_TOKEN_KEY = 'fcm_token';

export function useFCMToken(isAuthenticated) {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const listenerRef = useRef(null);
  const registeredRef = useRef(false);

  const registerToken = useCallback(async () => {
    if (registeredRef.current) return;

    try {
      const messaging = await getMessagingInstance();
      if (!messaging) return; // Browser not supported

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      // Get FCM token
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (!token) return;

      // Only register if token changed
      const storedToken = localStorage.getItem(FCM_TOKEN_KEY);
      if (token !== storedToken) {
        await registerDeviceTokenApi({
          token,
          platform: 'web',
          deviceInfo: {
            appVersion: process.env.REACT_APP_VERSION ?? '1.0.0',
            osVersion: navigator.userAgent,
          },
        });
        localStorage.setItem(FCM_TOKEN_KEY, token);
      }

      registeredRef.current = true;

      // ── Foreground message handler ──────────────────────────────────────
      // When app is in focus, Firebase doesn't show native notification.
      // We handle it by showing a toast + adding to Redux state.
      if (listenerRef.current) {
        listenerRef.current(); // unsubscribe previous
      }

      listenerRef.current = onMessage(messaging, (payload) => {
        const { title, body } = payload.notification ?? {};
        const data = payload.data ?? {};

        // Add to Redux store (appears in bell dropdown immediately)
        dispatch(
          addRealtimeNotification({
            _id: data.notificationId ?? Date.now().toString(),
            type: data.type ?? 'SYSTEM',
            title: title ?? 'New Notification',
            body: body ?? '',
            data,
            isRead: false,
            createdAt: new Date().toISOString(),
          })
        );

        // Re-fetch count from server to stay in sync
        dispatch(fetchUnreadCount());

        // Show toast for foreground notifications
        showToast(title ?? 'New Notification', 'info');
      });
    } catch (err) {
      // Silent fail — notifications are non-critical
      console.warn('FCM registration failed:', err.message);
    }
  }, [dispatch, showToast]);

  const removeToken = useCallback(async () => {
    const token = localStorage.getItem(FCM_TOKEN_KEY);
    if (token) {
      try {
        const { removeDeviceTokenApi } = await import('../api/notification.api');
        await removeDeviceTokenApi(token);
      } catch {
        // Best effort
      } finally {
        localStorage.removeItem(FCM_TOKEN_KEY);
        registeredRef.current = false;
      }
    }

    // Cleanup foreground listener
    if (listenerRef.current) {
      listenerRef.current();
      listenerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      registerToken();
    } else {
      // Cleanup when user logs out
      registeredRef.current = false;
      if (listenerRef.current) {
        listenerRef.current();
        listenerRef.current = null;
      }
    }
  }, [isAuthenticated, registerToken]);

  return { registerToken, removeToken };
}
