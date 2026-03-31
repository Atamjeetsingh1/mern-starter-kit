/**
 * App.jsx
 * Root component — wraps the router with the Redux store Provider.
 * All global providers (theme, toast, etc.) go here.
 */

import React from "react";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./app/store";
import AppRoutes from "./routes/AppRoutes";
import useSocket from "./hooks/useSocket";

const AppContent = () => {
  // Initialize the global socket connection tied to the auth session
  useSocket();
  return <AppRoutes />;
};

const App = () => (
  <Provider store={store}>
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  </Provider>
);

export default App;