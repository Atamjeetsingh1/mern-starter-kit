/**
 * components/ProtectedRoute.jsx — NEW FILE
 *
 * Critical fix: must NOT redirect to /login while rehydration is in progress.
 * Old pattern (no rehydration awareness):
 *   isAuthenticated ? <Outlet /> : <Navigate to="/login" />
 *   → On reload: user=null (Redux reset) → redirect to login → cookie ignored
 *
 * Fixed pattern:
 *   rehydrating  → show spinner (wait for cookie check)
 *   authenticated → render children
 *   confirmed not authenticated → redirect to login
 *
 * Usage in AppRoutes.jsx:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *     <Route path="/settings"  element={<SettingsPage />} />
 *   </Route>
 */

import React        from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector }                   from "react-redux";
import {
  selectIsAuthenticated,
  selectIsRehydrating,
}                   from "../features/auth/authSlice";

// ── Full-screen spinner shown during cookie check ─────────────────────────
const RehydrationSpinner = () => (
  <div
    role="status"
    aria-label="Checking session..."
    style={{
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      minHeight:      "100vh",
      backgroundColor:"#f9fafb",
    }}
  >
    <svg
      style={{ width: 32, height: 32, animation: "spin 1s linear infinite" }}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#4f46e5" strokeWidth="4" opacity="0.25" />
      <path fill="#4f46e5" opacity="0.75"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────

const ProtectedRoute = ({ redirectTo = "/login" }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isRehydrating   = useSelector(selectIsRehydrating);
  const location        = useLocation();

  // Still checking cookie — don't make any routing decision yet
  if (isRehydrating) {
    return <RehydrationSpinner />;
  }

  // Cookie confirmed valid — render the protected page
  if (isAuthenticated) {
    return <Outlet />;
  }

  // Confirmed no valid session — redirect, preserving intended destination
  return (
    <Navigate
      to={redirectTo}
      state={{ from: location.pathname }}
      replace
    />
  );
};

export default ProtectedRoute;