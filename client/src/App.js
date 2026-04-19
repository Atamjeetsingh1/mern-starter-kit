/**
 * App.jsx — Root component.
 * Provider order (innermost wins):
 *   Redux → Theme → Toast → Notifications → FeatureFlags → Router → Routes
 */
import React, { useEffect, useRef } from "react";
import { BrowserRouter }          from "react-router-dom";
import { Provider, useDispatch } from "react-redux";
import store                      from "./app/store";
import { ToastProvider }          from "./hooks/useToast";
import { FeatureFlagProvider }    from "./context/FeatureFlagContext";
import { useRedirectResult }      from "./hooks/useSocialAuth";
import { rehydrateSession } from "./features/auth/authSlice";
import ErrorBoundary              from "./components/ErrorBoundary";
import OfflineBanner              from "./components/offlineBanner";
import SessionTimeout             from "./components/SessionTimeout";
import AppRoutes                  from "./routes/AppRoutes";

// AppContent component handles rehydration and Firebase redirect result on mount
const AppContent = () => {
  const dispatch        = useDispatch();
  const { handleRedirectResult } = useRedirectResult();
  const hasRehydrated   = useRef(false);

  useEffect(() => {
    // Guard: only run once even in React StrictMode (double-invoke in dev)
    if (hasRehydrated.current) return;
    hasRehydrated.current = true;

    /**
     * Run both in parallel:
     *  - rehydrateSession: checks if httpOnly cookie is still valid
     *  - handleRedirectResult: processes any pending Firebase redirect
     *
     * handleRedirectResult is safe to call even when there's no
     * pending redirect — it returns early if getRedirectResult() is null.
     */
    Promise.all([
      dispatch(rehydrateSession()),
      handleRedirectResult(),
    ]).catch((err) => {
      // Should never reach here — both handle their own errors internally
      console.error("[AppContent] Startup error:", err);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Global persistent UI */}
      <OfflineBanner />
      <SessionTimeout />
      <AppRoutes />
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <Provider store={store}>
      <ToastProvider duration={4000}>
        <FeatureFlagProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </FeatureFlagProvider>
      </ToastProvider>
    </Provider>
  </ErrorBoundary>
);

export default App;