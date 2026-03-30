/**
 * hooks/useAuth.js
 * Convenience hook — gives any component clean access to auth state
 * and dispatch actions without importing selectors manually everywhere.
 */

import { useDispatch, useSelector } from "react-redux";
import {
  loginUser,
  registerUser,
  logoutUser,
  fetchCurrentUser,
  clearError,
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
} from "../features/auth/authSlice";
import { USER_ROLES } from "../constants";

const useAuth = () => {
  const dispatch = useDispatch();

  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  // ── Derived helpers ──────────────────────────────────────────────────────
  const isCustomer = user?.role === USER_ROLES.CUSTOMER;
  const isProvider = user?.role === USER_ROLES.PROVIDER;
  const isAdmin = user?.role === USER_ROLES.ADMIN;

  const hasRole = (...roles) => roles.includes(user?.role);

  // ── Action dispatchers ───────────────────────────────────────────────────
  const login = (credentials) => dispatch(loginUser(credentials));
  const register = (userData) => dispatch(registerUser(userData));
  const logout = () => dispatch(logoutUser());
  const fetchMe = () => dispatch(fetchCurrentUser());
  const resetError = () => dispatch(clearError());

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    // Derived
    isCustomer,
    isProvider,
    isAdmin,
    hasRole,
    // Actions
    login,
    register,
    logout,
    fetchMe,
    resetError,
  };
};

export default useAuth;