/**
 * api/auth.api.js
 * All HTTP calls for the auth endpoints.
 * Components / thunks call these functions — never axios directly.
 */

import axiosInstance from "./axiosInstance";

/**
 * @param {{ name, email, password, role }} data
 */
export const registerApi = (data) =>
  axiosInstance.post("/auth/register", data);

/**
 * @param {{ email, password }} credentials
 */
export const loginApi = (credentials) =>
  axiosInstance.post("/auth/login", credentials);

/**
 * @param {{ refreshToken: string }} payload
 */
export const refreshTokenApi = (payload) =>
  axiosInstance.post("/auth/refresh", payload);

export const logoutApi = () =>
  axiosInstance.post("/auth/logout");

export const forgotPasswordApi = (data) =>
  axiosInstance.post("/auth/forgot-password", data);

export const resetPasswordApi = (data) =>
  axiosInstance.post("/auth/reset-password", data);

/**
 * Social login - sends Firebase ID token to backend
 * @param {{ idToken: string, provider: string }} data
 */
export const socialLoginApi = (data) =>
  axiosInstance.post("/auth/social-login", data);

/**
 * Get current user - used for session rehydration
 * Checks if httpOnly cookie is still valid
 */
export const getMeApi = () =>
  axiosInstance.get("/auth/me", {
    _isRehydration: true, // Flag for interceptor to suppress redirect on 401
  });