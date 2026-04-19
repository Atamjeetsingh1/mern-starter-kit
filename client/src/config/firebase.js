/**
 * config/firebase.js
 * Firebase app initialisation + auth providers.
 * Exported providers are consumed by useSocialAuth hook.
 *
 * Required env vars (prefix REACT_APP_):
 *   REACT_APP_FIREBASE_API_KEY
 *   REACT_APP_FIREBASE_AUTH_DOMAIN
 *   REACT_APP_FIREBASE_PROJECT_ID
 *   REACT_APP_FIREBASE_APP_ID
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
} from "firebase/auth";

const firebaseConfig = {
  apiKey:     process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:  process.env.REACT_APP_FIREBASE_PROJECT_ID,
  appId:      process.env.REACT_APP_FIREBASE_APP_ID,
};

// Prevent duplicate app initialisation in StrictMode / HMR
const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);

// ── Google ─────────────────────────────────────────────────────────────────
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");
// Always show account picker so users can switch accounts
googleProvider.setCustomParameters({ prompt: "select_account" });

// ── Facebook ───────────────────────────────────────────────────────────────
export const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope("email");
facebookProvider.addScope("public_profile");

// ── Apple ──────────────────────────────────────────────────────────────────
export const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");
// Apple only returns name on the FIRST sign-in; store it immediately
appleProvider.setCustomParameters({ locale: "en" });

export default firebaseApp;
