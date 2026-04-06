/**
 * context/FeatureFlagContext.jsx
 * ────────────────────────────────
 * Fetches evaluated feature flags for the current user from the server.
 * Re-fetches on login. Provides useFeatureFlag() hook for component use.
 *
 * Usage:
 *   const isEnabled = useFeatureFlag("new_dashboard");
 *   if (isEnabled) return <NewDashboard />;
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "../features/auth/authSlice";

const FeatureFlagContext = createContext({});

export const FeatureFlagProvider = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [flags, setFlags] = useState({});

  useEffect(() => {
    if (!isAuthenticated) { setFlags({}); return; }
    axiosInstance.get("/feature-flags")
      .then(({ data }) => setFlags(data.data?.flags ?? {}))
      .catch(() => {}); // Fail silently
  }, [isAuthenticated]);

  return (
    <FeatureFlagContext.Provider value={flags}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

/**
 * Check if a feature flag is enabled for the current user.
 * @param {string} key  Flag key, e.g. "new_dashboard"
 * @returns {boolean}
 */
export const useFeatureFlag = (key) => {
  const flags = useContext(FeatureFlagContext);
  return flags[key] === true;
};