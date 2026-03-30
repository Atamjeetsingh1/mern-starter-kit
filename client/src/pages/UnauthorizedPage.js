import React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../constants";

const UnauthorizedPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div className="text-center space-y-4">
      <p className="text-8xl font-black text-red-100 select-none">403</p>
      <h1 className="text-2xl font-bold text-gray-900 -mt-4">Access denied</h1>
      <p className="text-gray-500 text-sm max-w-xs mx-auto">
        You don't have permission to view this page.
      </p>
      <Link
        to={ROUTES.DASHBOARD}
        className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
      >
        ← Back to Dashboard
      </Link>
    </div>
  </div>
);

export default UnauthorizedPage;