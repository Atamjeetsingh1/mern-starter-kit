/**
 * config/firebase.js
 * Firebase client-side initialization for FCM push notifications.
 *
 * Setup:
 *   1. Go to Firebase Console → Project Settings → General → Your apps → Web app
 *   2. Copy the firebaseConfig values to your .env file
 *   3. Go to Cloud Messaging → Web configuration → Generate VAPID key pair
 *   4. Copy the VAPID key to REACT_APP_FIREBASE_VAPID_KEY
 */

import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

// Prevent re-initialization on hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

/**
 * Get Firebase Messaging instance.
 * Returns null if browser doesn't support it (Safari < 16, Firefox private mode, etc.)
 */
export async function getMessagingInstance() {
  try {
    const supported = await isSupported();
    if (!supported) return null;
    return getMessaging(app);
  } catch {
    return null;
  }
}

export default app;
