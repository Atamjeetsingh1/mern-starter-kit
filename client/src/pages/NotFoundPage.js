import React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../constants";

const NotFoundPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div className="text-center space-y-4">
      <p className="text-8xl font-black text-indigo-100 select-none">404</p>
      <h1 className="text-2xl font-bold text-gray-900 -mt-4">Page not found</h1>
      <p className="text-gray-500 text-sm max-w-xs mx-auto">
        The page you're looking for doesn't exist or has been moved.
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

export default NotFoundPage;