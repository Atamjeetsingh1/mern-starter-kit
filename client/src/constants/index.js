/**
 * constants/index.js
 * Front-end constants — mirrors some backend values to avoid magic strings.
 */

export const USER_ROLES = Object.freeze({
  CUSTOMER: "customer",
  PROVIDER: "provider",
  ADMIN:    "admin",
});

export const STORAGE_KEYS = Object.freeze({
  ACCESS_TOKEN:  "accessToken",
  REFRESH_TOKEN: "refreshToken",
  USER:          "user",
});

export const ROUTES = Object.freeze({
  HOME:      "/",
  LOGIN:     "/login",
  REGISTER:  "/register",
  DASHBOARD: "/dashboard",
  PROFILE:   "/profile",
  NOTIFICATIONS: "/notifications",
  UNAUTHORIZED: "/unauthorized",
});