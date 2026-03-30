/**
 * app/store.js
 * Redux Toolkit store configuration.
 * Add new slice reducers here as the app grows.
 */

import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    // Add more slices here, e.g.:
    // users: usersReducer,
  },
  devTools: import.meta.env.DEV, // Enable Redux DevTools only in development
});

export default store;