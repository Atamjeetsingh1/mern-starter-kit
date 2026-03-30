/**
 * layouts/AuthLayout.jsx
 * Centered card layout used by Login and Register pages.
 */

import React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../constants";

const AuthLayout = ({ children, title, subtitle, footerText, footerLinkText, footerLinkTo }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <Link to={ROUTES.HOME} className="inline-flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">MERN App</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-10">
          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>

          {children}
        </div>

        {/* Footer link */}
        {footerText && footerLinkTo && (
          <p className="text-center text-sm text-gray-500 mt-6">
            {footerText}{" "}
            <Link
              to={footerLinkTo}
              className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              {footerLinkText}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthLayout;