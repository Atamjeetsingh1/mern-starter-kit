/**
 * features/auth/authSlice.js
 * Redux Toolkit slice for authentication state.
 * Handles login, register, logout, and restoring session from localStorage.
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loginApi, registerApi, logoutApi, getMeApi } from "../../api/auth.api";
import {
  setTokens,
  setStoredUser,
  clearAuthStorage,
  getStoredUser,
  getAccessToken,
} from "../../utils/storage";

// ── Initial state ──────────────────────────────────────────────────────────
const initialState = {
  user: getStoredUser(),   // Rehydrate from localStorage on page load
  isAuthenticated: !!getAccessToken(),
  isLoading: false,
  error: null,
};

// ── Async thunks ───────────────────────────────────────────────────────────

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await loginApi(credentials);
      return data.data; // { user, accessToken, refreshToken }
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Login failed."
      );
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await registerApi(userData);
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Registration failed."
      );
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await logoutApi();
    } catch (err) {
      // Even if the server call fails, we clear local storage
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await getMeApi();
      return data.data.user;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch user."
      );
    }
  }
);

// ── Slice ──────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Clear error manually (e.g. when user dismisses alert)
    clearError(state) {
      state.error = null;
    },
    // Force logout locally without hitting the server (token expiry edge case)
    forceLogout(state) {
      state.user = null;
      state.isAuthenticated = false;
      clearAuthStorage();
    },
  },
  extraReducers: (builder) => {
    // ── Login ──────────────────────────────────────────────────────────────
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = payload.user;
        setTokens(payload.accessToken, payload.refreshToken);
        setStoredUser(payload.user);
      })
      .addCase(loginUser.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      });

    // ── Register ───────────────────────────────────────────────────────────
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = payload.user;
        setTokens(payload.accessToken, payload.refreshToken);
        setStoredUser(payload.user);
      })
      .addCase(registerUser.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      });

    // ── Logout ─────────────────────────────────────────────────────────────
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        clearAuthStorage();
      })
      .addCase(logoutUser.rejected, (state) => {
        // Clear locally even on server error
        state.user = null;
        state.isAuthenticated = false;
        clearAuthStorage();
      });

    // ── Fetch me ───────────────────────────────────────────────────────────
    builder
      .addCase(fetchCurrentUser.fulfilled, (state, { payload }) => {
        state.user = payload;
        setStoredUser(payload);
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        clearAuthStorage();
      });
  },
});

export const { clearError, forceLogout } = authSlice.actions;

// ── Selectors ──────────────────────────────────────────────────────────────
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;