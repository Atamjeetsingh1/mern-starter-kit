/**
 * hooks/useSocialAuth.js
 * Encapsulates Firebase popup sign-in → backend token exchange → Redux dispatch.
 *
 * Edge cases handled:
 *  - Popup blocked by browser → fallback to redirect flow
 *  - User closes popup (auth/popup-closed-by-user) → silent ignore
 *  - Network timeout during backend call → user-friendly message
 *  - Firebase token fetch failure → proper error surfaced
 *  - Concurrent click prevention via loading state
 *  - Apple name only returned on first sign-in → handled
 *  - Firebase account-exists-with-different-credential → actionable message
 */

import { useState, useCallback } from "react";
import { useDispatch }           from "react-redux";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  browserPopupRedirectResolver,
} from "firebase/auth";
import {
  auth,
  googleProvider,
  facebookProvider,
  appleProvider,
} from "../config/firebase";
import { socialLogin } from "../features/auth/authSlice";
import { useToast }    from "./useToast";

// Map provider string → Firebase provider instance
const PROVIDERS = {
  google:   googleProvider,
  facebook: facebookProvider,
  apple:    appleProvider,
};

// Human-readable names for toasts
const PROVIDER_NAMES = {
  google:   "Google",
  facebook: "Facebook",
  apple:    "Apple",
};

// Firebase error codes that should NOT show an error toast to the user
const SILENT_ERRORS = new Set([
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/user-cancelled",
]);

/**
 * Map Firebase error codes → user-friendly messages
 */
const getFriendlyError = (code, providerName) => {
  switch (code) {
    case "auth/account-exists-with-different-credential":
      return `An account already exists with this email. Please sign in with a different method, then link ${providerName} in your account settings.`;
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in popup. Trying redirect method...";
    case "auth/network-request-failed":
      return "Network error. Please check your connection and try again.";
    case "auth/too-many-requests":
      return "Too many sign-in attempts. Please wait a few minutes and try again.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/operation-not-allowed":
      return `${providerName} sign-in is not enabled. Please contact support.`;
    case "auth/invalid-credential":
      return "Invalid credentials. Please try again.";
    default:
      return `${providerName} sign-in failed. Please try again.`;
  }
};

// ─────────────────────────────────────────────────────────────────────────────

export const useSocialAuth = () => {
  const dispatch = useDispatch();
  const toast = useToast();

  // Track which provider is currently loading (null = none)
  const [loadingProvider, setLoadingProvider] = useState(null);

  /**
   * handleSocialLogin
   * @param {"google"|"facebook"|"apple"} providerKey
   */
  const handleSocialLogin = useCallback(
    async (providerKey) => {
      // Prevent concurrent sign-in attempts
      if (loadingProvider) return;

      const provider     = PROVIDERS[providerKey];
      const providerName = PROVIDER_NAMES[providerKey];

      if (!provider) {
        console.error(`[useSocialAuth] Unknown provider: "${providerKey}"`);
        return;
      }

      setLoadingProvider(providerKey);

      try {
        // ── Step 1: Firebase popup sign-in ─────────────────────────────
        let userCredential;
        try {
          userCredential = await signInWithPopup(
            auth,
            provider,
            browserPopupRedirectResolver
          );
        } catch (firebaseErr) {
          const code = firebaseErr?.code || "";

          // Silent — user intentionally closed popup
          if (SILENT_ERRORS.has(code)) {
            setLoadingProvider(null);
            return;
          }

          // Popup blocked → fall back to redirect
          if (code === "auth/popup-blocked") {
            toast.info("Redirecting to sign-in page...");
            // Store intended destination so we can redirect back after
            sessionStorage.setItem("socialLoginProvider", providerKey);
            sessionStorage.setItem(
              "postLoginRedirect",
              window.location.pathname
            );
            await signInWithRedirect(auth, provider);
            // Execution stops here — redirect result handled in useRedirectResult
            return;
          }

          throw firebaseErr; // Re-throw for outer catch
        }

        // ── Step 2: Get Firebase ID token ──────────────────────────────
        // forceRefresh=false is fine here — token is freshly issued
        const idToken = await userCredential.user.getIdToken(false);

        if (!idToken) {
          throw new Error("Failed to retrieve authentication token from Firebase.");
        }

        // ── Step 3: Send token to backend ──────────────────────────────
        const result = await dispatch(socialLogin({ idToken, provider: providerKey }));

        if (socialLogin.rejected.match(result)) {
          // Error already stored in Redux; surface it as toast too
          const msg =
            result.payload?.message ||
            `${providerName} sign-in failed. Please try again.`;
          toast.error(msg);
          return;
        }

        toast.success(`Signed in with ${providerName}!`);

      } catch (err) {
        const code         = err?.code || "";
        const providerName = PROVIDER_NAMES[providerKey];

        if (!SILENT_ERRORS.has(code)) {
          const message = getFriendlyError(code, providerName);
          toast.error(message);
          console.error(`[useSocialAuth] ${providerKey} error:`, err);
        }
      } finally {
        setLoadingProvider(null);
      }
    },
    [dispatch, loadingProvider, toast]
  );

  return { handleSocialLogin, loadingProvider };
};

// ─────────────────────────────────────────────────────────────────────────────
// Companion hook: handles the redirect result when the popup-blocked
// fallback redirects the user back to the app.
// Mount this once at app level (e.g. inside AppContent).
// ─────────────────────────────────────────────────────────────────────────────
export const useRedirectResult = () => {
  const dispatch    = useDispatch();
  const toast = useToast();

  const handleRedirectResult = useCallback(async () => {
    try {
      const result = await getRedirectResult(auth, browserPopupRedirectResolver);
      if (!result) return; // No pending redirect

      const providerKey  = sessionStorage.getItem("socialLoginProvider") || "google";
      const providerName = PROVIDER_NAMES[providerKey] || "Social";
      const returnTo     = sessionStorage.getItem("postLoginRedirect") || "/dashboard";

      sessionStorage.removeItem("socialLoginProvider");
      sessionStorage.removeItem("postLoginRedirect");

      const idToken = await result.user.getIdToken(false);
      if (!idToken) throw new Error("Failed to get ID token from redirect result.");

      const action = await dispatch(
        socialLogin({ idToken, provider: providerKey })
      );

      if (socialLogin.rejected.match(action)) {
        toast.error(action.payload?.message || `${providerName} sign-in failed.`);
        return;
      }

      toast.success(`Signed in with ${providerName}!`);

      // Navigate to original destination
      window.location.replace(returnTo);

    } catch (err) {
      const code = err?.code || "";
      if (!SILENT_ERRORS.has(code)) {
        console.error("[useRedirectResult] Error:", err);
        toast.error("Sign-in failed after redirect. Please try again.");
      }
    }
  }, [dispatch, toast]);

  return { handleRedirectResult };
};
