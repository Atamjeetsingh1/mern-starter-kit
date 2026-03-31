/**
 * components/layout/Sidebar.jsx
 * Collapsible sidebar navigation.
 * - Desktop: fixed left panel, icon-only when collapsed
 * - Mobile: slide-in drawer controlled by `mobileOpen` prop
 *
 * Usage:
 *   <Sidebar
 *     collapsed={collapsed}
 *     onToggle={() => setCollapsed(v => !v)}
 *     mobileOpen={mobileOpen}
 *     onMobileClose={() => setMobileOpen(false)}
 *   />
 */

import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { ROUTES, USER_ROLES } from "../constants";
import {
  Icon,
  HomeIcon, DashboardIcon, UsersIcon, SettingsIcon,
  LogoutIcon, ChevronRightIcon, MenuIcon, CloseIcon,
  UserIcon, ChartIcon,
} from "../components/IconCollection";
import Avatar from "../components/Avatar";
import Tooltip from "../components/Tooltip";

// ── Nav item definition ────────────────────────────────────────────────────
const buildNavItems = ({ isAdmin, isProvider }) => [
  {
    group: "Main",
    items: [
      { label: "Dashboard", to: ROUTES.DASHBOARD, icon: "dashboard" },
      { label: "Analytics", to: "/analytics", icon: "chart", roles: [USER_ROLES.PROVIDER, USER_ROLES.ADMIN] },
    ],
  },
  {
    group: "Management",
    items: [
      { label: "Users", to: "/users", icon: "users", roles: [USER_ROLES.ADMIN, USER_ROLES.PROVIDER] },
      { label: "Profile", to: ROUTES.PROFILE, icon: "user" },
    ],
  },
  {
    group: "System",
    items: [
      { label: "Settings", to: "/settings", icon: "settings" },
    ],
  },
];

// ── Single nav link ────────────────────────────────────────────────────────
const NavItem = ({ item, collapsed }) => {
  const link = (
    <NavLink
      to={item.to}
      end={item.to === ROUTES.DASHBOARD}
      className={({ isActive }) => `
        flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
        transition-all duration-150 group
        ${isActive
          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}
        ${collapsed ? "justify-center" : ""}
      `}
    >
      <Icon name={item.icon} size={18} className="shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );

  if (collapsed) {
    return <Tooltip content={item.label} placement="right">{link}</Tooltip>;
  }
  return link;
};

// ── Sidebar content ────────────────────────────────────────────────────────
const SidebarContent = ({ collapsed, onToggle, onMobileClose, isMobile }) => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const navItems = buildNavItems({ isAdmin: hasRole("admin"), isProvider: hasRole("provider") });

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className={`
      flex flex-col h-full bg-white border-r border-gray-100
      transition-all duration-300
      ${collapsed ? "w-[68px]" : "w-64"}
    `}>
      {/* ── Brand + toggle ─────────────────────────────────────────────── */}
      <div className={`
        flex items-center h-16 px-4 border-b border-gray-50 shrink-0
        ${collapsed ? "justify-center" : "justify-between"}
      `}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
              <Icon name="loading" size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-base">MERN App</span>
          </div>
        )}
        {collapsed && (
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Icon name="loading" size={16} className="text-white" />
          </div>
        )}

        {/* Desktop collapse toggle / Mobile close */}
        {isMobile ? (
          <button onClick={onMobileClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
            <CloseIcon size={18} />
          </button>
        ) : (
          <button
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors ${collapsed ? "mt-4" : ""}`}
          >
            <MenuIcon size={18} />
          </button>
        )}
      </div>

      {/* ── Nav groups ────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navItems.map((group) => {
          const visibleItems = group.items.filter((item) =>
            !item.roles || item.roles.some((r) => hasRole(r))
          );
          if (!visibleItems.length) return null;

          return (
            <div key={group.group}>
              {!collapsed && (
                <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                  {group.group}
                </p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => (
                  <NavItem key={item.to} item={item} collapsed={collapsed} />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── User card + logout ────────────────────────────────────────── */}
      <div className={`border-t border-gray-50 p-3 ${collapsed ? "flex justify-center" : ""}`}>
        {collapsed ? (
          <Tooltip content={`${user?.name} · ${user?.role}`} placement="right">
            <Avatar name={user?.name} size="sm" className="cursor-default" />
          </Tooltip>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar name={user?.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize truncate">{user?.role}</p>
            </div>
            <Tooltip content="Log out" placement="top">
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                aria-label="Log out"
              >
                <LogoutIcon size={16} />
              </button>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Exported Sidebar ───────────────────────────────────────────────────────
const Sidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => (
  <>
    {/* Desktop sidebar */}
    <aside className="hidden lg:flex flex-col shrink-0">
      <SidebarContent collapsed={collapsed} onToggle={onToggle} isMobile={false} />
    </aside>

    {/* Mobile overlay */}
    {mobileOpen && (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
        {/* Drawer */}
        <aside className="fixed inset-y-0 left-0 z-50 flex lg:hidden animate-[slideInLeft_200ms_ease-out]">
          <SidebarContent
            collapsed={false}
            onMobileClose={onMobileClose}
            isMobile
          />
        </aside>
      </>
    )}
  </>
);

export default Sidebar;