/**
 * components/layout/Topbar.jsx
 * Top navigation bar used in the sidebar layout.
 * Features: mobile menu toggle, search, notification bell, user dropdown.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { ROUTES } from "../constants";
import {
  MenuIcon, BellIcon, SearchIcon,
  UserIcon, SettingsIcon, LogoutIcon,
} from "../components/IconCollection";
import Avatar from "../components/Avatar";
import Dropdown from "../components/Dropdown";
import SearchBar from "../components/SearchBar";
import Badge from "../components/Badge";

const Topbar = ({ onMobileMenuOpen, pageTitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const userMenuItems = [
    {
      label: "My Profile",
      icon: <UserIcon size={15} />,
      href: ROUTES.PROFILE,
    },
    {
      label: "Settings",
      icon: <SettingsIcon size={15} />,
      href: "/settings",
    },
    { divider: true },
    {
      label: "Log out",
      icon: <LogoutIcon size={15} />,
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center px-4 sm:px-6 gap-4 shrink-0">
      {/* ── Mobile hamburger ─────────────────────────────────────────── */}
      <button
        onClick={onMobileMenuOpen}
        className="lg:hidden p-2 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Open navigation"
      >
        <MenuIcon size={20} />
      </button>

      {/* ── Page title ───────────────────────────────────────────────── */}
      {pageTitle && !showSearch && (
        <h1 className="font-semibold text-gray-900 text-base hidden sm:block">
          {pageTitle}
        </h1>
      )}

      {/* ── Spacer ───────────────────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Search (desktop inline / mobile toggle) ──────────────────── */}
      <div className="hidden md:block w-64">
        <SearchBar placeholder="Search…" debounce={400} />
      </div>

      {/* Mobile search toggle */}
      <button
        onClick={() => setShowSearch((v) => !v)}
        className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Toggle search"
      >
        <SearchIcon size={18} />
      </button>

      {/* ── Notifications ────────────────────────────────────────────── */}
      <Dropdown
        align="right"
        trigger={
          <button
            aria-label="Notifications"
            className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <BellIcon size={20} />
            {/* Unread dot */}
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>
        }
        items={[
          { label: "No new notifications", disabled: true },
        ]}
        minWidth="220px"
      />

      {/* ── User menu ────────────────────────────────────────────────── */}
      <Dropdown
        align="right"
        trigger={
          <button
            aria-label="User menu"
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-gray-100 transition-colors"
          >
            <Avatar name={user?.name} size="sm" />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900 leading-tight">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </button>
        }
        items={userMenuItems}
        minWidth="200px"
      />

      {/* Mobile search bar (full width) */}
      {showSearch && (
        <div className="absolute inset-x-0 top-16 px-4 py-3 bg-white border-b border-gray-100 md:hidden shadow-sm">
          <SearchBar
            placeholder="Search…"
            debounce={400}
            autoFocus
          />
        </div>
      )}
    </header>
  );
};

export default Topbar;