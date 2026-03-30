/**
 * pages/DashboardPage.jsx
 * Post-login landing page — role-aware content.
 * Replace the placeholder cards with real widgets as the app grows.
 */

import React from "react";
import useAuth from "../hooks/useAuth";
import { USER_ROLES } from "../constants";

// ── Stat card component ────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, color = "indigo" }) => {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-start gap-4">
      <div className={`p-3 rounded-xl text-2xl ${colors[color] ?? colors.indigo}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
};

// ── Role-specific panels ───────────────────────────────────────────────────
const CustomerPanel = ({ name }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard label="Active Orders" value="3" icon="📦" color="indigo" />
      <StatCard label="Completed" value="12" icon="✅" color="green" />
      <StatCard label="Saved Items" value="7" icon="❤️" color="purple" />
    </div>
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-semibold text-gray-900 mb-4">Recent Activity</h2>
      <p className="text-sm text-gray-500">No recent activity yet. Start exploring services!</p>
    </div>
  </div>
);

const ProviderPanel = ({ name }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Total Bookings" value="48" icon="📅" color="indigo" />
      <StatCard label="This Month" value="11" icon="📈" color="green" />
      <StatCard label="Pending" value="4" icon="⏳" color="amber" />
      <StatCard label="Revenue" value="$840" icon="💰" color="purple" />
    </div>
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-semibold text-gray-900 mb-4">Upcoming Bookings</h2>
      <p className="text-sm text-gray-500">No upcoming bookings. Share your profile to get started!</p>
    </div>
  </div>
);

// ── Page ───────────────────────────────────────────────────────────────────
const DashboardPage = () => {
  const { user, isProvider } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl px-6 py-7 text-white">
        <p className="text-sm font-medium text-indigo-200 capitalize mb-1">
          {user?.role} dashboard
        </p>
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-indigo-200 mt-1">
          Here's what's happening today.
        </p>
      </div>

      {/* Role-specific content */}
      {isProvider
        ? <ProviderPanel name={user?.name} />
        : <CustomerPanel name={user?.name} />}
    </div>
  );
};

export default DashboardPage;