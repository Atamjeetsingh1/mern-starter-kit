/**
 * App.jsx — Root component.
 * Provider order (innermost wins):
 *   Redux → Theme → Toast → Notifications → FeatureFlags → Router → Routes
 */
import React from "react";
import { BrowserRouter }          from "react-router-dom";
import { Provider }               from "react-redux";
import store                      from "./app/store";
import { ToastProvider }          from "./hooks/useToast";
import { FeatureFlagProvider }    from "./context/FeatureFlagContext";
import ErrorBoundary              from "./components/ErrorBoundary";
import OfflineBanner              from "./components/offlineBanner";
import SessionTimeout             from "./components/SessionTimeout";
import AppRoutes                  from "./routes/AppRoutes";

const App = () => (
  <ErrorBoundary>
    <Provider store={store}>
        <ToastProvider duration={4000}>
            <FeatureFlagProvider>
              <BrowserRouter>
                {/* Global persistent UI */}
                <OfflineBanner />
                <SessionTimeout />
                <AppRoutes />
              </BrowserRouter>
            </FeatureFlagProvider>
          
        </ToastProvider>
    </Provider>
  </ErrorBoundary>
);

export default App;