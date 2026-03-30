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

const App = () => (
  <Provider store={store}>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </Provider>
);

export default App;