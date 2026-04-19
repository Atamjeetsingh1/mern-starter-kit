/**
 * App.jsx — Root component.
 * Provider order (innermost wins):
 *   Redux → Theme → Toast → Notifications → FeatureFlags → Router → Routes
 */
import React, { useEffect } from "react";
import { BrowserRouter }          from "react-router-dom";
import { Provider }               from "react-redux";
import store                      from "./app/store";
import { ToastProvider }          from "./hooks/useToast";
import { FeatureFlagProvider }    from "./context/FeatureFlagContext";
import { useRedirectResult }      from "./hooks/useSocialAuth";
import ErrorBoundary              from "./components/ErrorBoundary";
import OfflineBanner              from "./components/offlineBanner";
import SessionTimeout             from "./components/SessionTimeout";
import AppRoutes                  from "./routes/AppRoutes";

// AppContent component handles Firebase redirect result on mount
const AppContent = () => {
  const { handleRedirectResult } = useRedirectResult();

  // Handle Firebase redirect result on app load (popup-blocked fallback)
  useEffect(() => {
    handleRedirectResult();
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