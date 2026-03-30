/**
 * layouts/MainLayout.jsx
 * Main app shell with top navigation bar.
 * Wrap protected pages with this layout.
 */

import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { ROUTES } from "../constants";
import Button from "../components/Button";

const NavItem = ({ to, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `text-sm font-medium transition-colors px-3 py-1.5 rounded-lg ${isActive
        ? "text-indigo-600 bg-indigo-50"
        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      }`
    }
  >
    {children}
  </NavLink>
);

const MainLayout = ({ children }) => {
  const { user, logout, isAdmin, isProvider } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Brand */}
            <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-bold text-gray-900">MERN App</span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              <NavItem to={ROUTES.DASHBOARD}>Dashboard</NavItem>
              {(isAdmin || isProvider) && (
                <NavItem to="/users">Users</NavItem>
              )}
              <NavItem to={ROUTES.PROFILE}>Profile</NavItem>
            </div>

            {/* Right — user info + logout */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Log out
              </Button>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 px-4 py-3 space-y-1 bg-white">
            <NavItem to={ROUTES.DASHBOARD}>Dashboard</NavItem>
            {(isAdmin || isProvider) && <NavItem to="/users">Users</NavItem>}
            <NavItem to={ROUTES.PROFILE}>Profile</NavItem>
            <div className="pt-2 border-t border-gray-100 mt-2">
              <Button variant="outline" size="sm" fullWidth onClick={handleLogout}>
                Log out
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Page content ───────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;