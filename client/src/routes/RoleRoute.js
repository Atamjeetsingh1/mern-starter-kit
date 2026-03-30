/**
 * routes/RoleRoute.jsx
 * Extends PrivateRoute — additionally checks that the user has one of the
 * required roles. Redirects to /unauthorized if the role doesn't match.
 *
 * Usage:
 *   <Route
 *     path="/admin"
 *     element={
 *       <RoleRoute roles={["admin"]}>
 *         <AdminPage />
 *       </RoleRoute>
 *     }
 *   />
 */

import React from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { ROUTES } from "../constants";
import PrivateRoute from "./PrivateRoute";

const RoleRoute = ({ children, roles = [] }) => {
  const { user, isAuthenticated } = useAuth();

  // Let PrivateRoute handle the unauthenticated case
  return (
    <PrivateRoute>
      {isAuthenticated && !roles.includes(user?.role) ? (
        <Navigate to={ROUTES.UNAUTHORIZED} replace />
      ) : (
        children
      )}
    </PrivateRoute>
  );
};

export default RoleRoute;