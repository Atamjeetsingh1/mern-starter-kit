/**
 * api/axiosInstance.js
 * Axios instance with:
 *  - Automatic Bearer token injection
 *  - Silent token refresh on 401
 *  - Redirect to login on refresh failure
 */

import axios from "axios";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearAuthStorage,
} from "../utils/storage";
import { ROUTES } from "../constants";

const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api/v1";

// ── Create the main instance ───────────────────────────────────────────────
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10_000, // 10 s
  withCredentials: true, // Required to send/receive cookies
});

// ── Request interceptor — attach access token ──────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle 401 / token refresh ─────────────────────
let isRefreshing = false;
// Queue of requests that arrived while a refresh was in progress
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // During rehydration: 401 just means no cookie. Don't redirect.
    if (error.response?.status === 401 && originalRequest._isRehydration) {
      return Promise.reject(error);
    }

    // Only attempt a refresh on 401 and only once per request
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Park this request until the refresh finishes
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      clearAuthStorage();
      window.location.href = ROUTES.LOGIN;
      return Promise.reject(error);
    }

    try {
      // Use a plain axios call (not the instance) to avoid interceptor loops
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
        refreshToken,
      }, { withCredentials: true });

      const { accessToken, refreshToken: newRefreshToken } = data.data;
      setTokens(accessToken, newRefreshToken);

      // Update Authorization header for all queued + current requests
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      processQueue(null, accessToken);
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearAuthStorage();
      window.location.href = ROUTES.LOGIN;
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;