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
