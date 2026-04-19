/**
 * features/auth/authSlice.js
 * Redux Toolkit slice for authentication state.
 * Handles login, register, logout, and restoring session from localStorage.
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loginApi, registerApi, logoutApi, socialLoginApi, getMeApi } from "../../api/auth.api";
import { getMyProfileApi } from "../../api/user.api";
import { auth } from "../../config/firebase";
import { signOut as firebaseSignOut } from "firebase/auth";
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
  isRehydrating: true,   // Track initial session check
  loadingProvider: null,   // Track which social provider is loading
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
      // Firebase sign-out (best-effort — don't block on failure)
      await firebaseSignOut(auth).catch(() => {});
      await logoutApi();
    } catch (err) {
      return rejectWithValue({
        message: err?.response?.data?.message || "Logout failed.",
      });
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await getMyProfileApi();
      return data.data.user;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch user."
      );
    }
  }
);

/**
 * socialLogin
 * 1. Receives the Firebase IdToken from useSocialAuth hook.
 * 2. Sends it to the Express backend.
 * 3. Backend verifies, upserts user, sets httpOnly JWT cookie, returns user.
 */
export const socialLogin = createAsyncThunk(
  "auth/socialLogin",
  async ({ idToken, provider }, { rejectWithValue }) => {
    try {
      const { data } = await socialLoginApi({ idToken, provider });
      return data; // { user, accessToken }
    } catch (err) {
      // Normalise error shape for consistent UI handling
      return rejectWithValue({
        message: err?.response?.data?.message || err.message || "Social login failed.",
        code:    err?.response?.status || 500,
      });
    }
  }
);

/**
 * rehydrateSession
 * Called on app mount to check if httpOnly cookie is still valid
 */
export const rehydrateSession = createAsyncThunk(
  "auth/rehydrateSession",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await getMeApi();
      return data.data.user;
    } catch (err) {
      // 401 = no valid session — not an error, just not logged in
      if (err?.response?.status === 401) {
        return rejectWithValue({ message: "No active session.", code: 401 });
      }
      return rejectWithValue({
        message: err?.message || "Session check failed.",
        code: err?.response?.status || 0,
      });
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
    /** Reset error state (useful before retrying) */
    resetError(state) {
      state.error  = null;
      state.isLoading = false;
    },
    /** Force-reset — e.g. on 401 interceptor */
    resetAuth(state) {
      state.user   = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error  = null;
      state.isRehydrating = false;
      state.loadingProvider = null;
      clearAuthStorage();
    },
    /** Set which social provider is loading */
    setLoadingProvider(state, action) {
      state.loadingProvider = action.payload;
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

    // ── socialLogin ─────────────────────────────────────────────────────
    builder
      .addCase(socialLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(socialLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.loadingProvider = null;
        setStoredUser(action.payload.user);
        // Store access token in localStorage for Authorization header
        if (action.payload.accessToken) {
          localStorage.setItem('accessToken', action.payload.accessToken);
        }
      })
      .addCase(socialLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Social login failed.";
        state.loadingProvider = null;
      });

    // ── rehydrateSession ────────────────────────────────────────────────
    builder
      .addCase(rehydrateSession.pending, (state) => {
        state.isRehydrating = true;
      })
      .addCase(rehydrateSession.fulfilled, (state, action) => {
        state.isRehydrating = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        setStoredUser(action.payload);
      })
      .addCase(rehydrateSession.rejected, (state) => {
        state.isRehydrating = false;
        state.isAuthenticated = false;
        state.user = null;
      });
  },
});

export const { clearError, forceLogout, resetError, resetAuth, setLoadingProvider } = authSlice.actions;

// ── Selectors ──────────────────────────────────────────────────────────────
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectIsRehydrating = (state) => state.auth.isRehydrating;
export const selectLoadingProvider = (state) => state.auth.loadingProvider;

export default authSlice.reducer;