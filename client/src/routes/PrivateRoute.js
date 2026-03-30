/**
 * routes/PrivateRoute.jsx
 * Wraps a route so only authenticated users can access it.
 * Redirects unauthenticated visitors to the login page,
 * preserving the intended destination via `state.from`.
 *
 * Usage:
 *   <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
 */

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { ROUTES } from "../constants";
import Loader from "../components/Loader";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // While Redux rehydrates / a fetchMe call is in-flight, show a loader
  if (isLoading) {
    return <Loader fullScreen label="Verifying session…" />;
  }

  if (!isAuthenticated) {
    // Pass current location so we can redirect back after login
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;