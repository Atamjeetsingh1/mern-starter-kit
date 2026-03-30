/**
 * routes/AppRoutes.jsx
 * Centralised route definitions using React Router v6.
 * Add new pages here — don't scatter <Route> elements across the app.
 */

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { ROUTES, USER_ROLES } from "../constants";

// Layouts
import MainLayout from "../layouts/MainLayout";

// Pages
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import ProfilePage from "../pages/ProfilePage";
import NotFoundPage from "../pages/NotFoundPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";

// Guards
import PrivateRoute from "./PrivateRoute";
import RoleRoute from "./RoleRoute";

const AppRoutes = () => (
  <Routes>
    {/* ── Public ──────────────────────────────────────────────────────── */}
    <Route path={ROUTES.LOGIN} element={<LoginPage />} />
    <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
    <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />

    {/* ── Root redirect ───────────────────────────────────────────────── */}
    <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />

    {/* ── Protected pages (any authenticated user) ─────────────────── */}
    <Route
      path={ROUTES.DASHBOARD}
      element={
        <PrivateRoute>
          <MainLayout>
            <DashboardPage />
          </MainLayout>
        </PrivateRoute>
      }
    />
    <Route
      path={ROUTES.PROFILE}
      element={
        <PrivateRoute>
          <MainLayout>
            <ProfilePage />
          </MainLayout>
        </PrivateRoute>
      }
    />

    {/* ── Role-restricted example ──────────────────────────────────── */}
    {/* Uncomment and add your AdminPage when ready:
    <Route
      path="/admin"
      element={
        <RoleRoute roles={[USER_ROLES.ADMIN]}>
          <MainLayout>
            <AdminPage />
          </MainLayout>
        </RoleRoute>
      }
    /> */}

    {/* ── 404 ─────────────────────────────────────────────────────────── */}
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default AppRoutes;