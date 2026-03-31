/**
 * layouts/SidebarLayout.jsx
 * Full-page authenticated shell:
 *   [Sidebar] + [Topbar / Main content / Footer]
 *
 * Usage:
 *   <Route path="/dashboard" element={
 *     <PrivateRoute>
 *       <SidebarLayout pageTitle="Dashboard">
 *         <DashboardPage />
 *       </SidebarLayout>
 *     </PrivateRoute>
 *   } />
 */

import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar  from "../components/Topbar";
import Footer  from "../components/Footer";
import useLocalStorage from "../hooks/useLocalStorage";

const SidebarLayout = ({ children, pageTitle, noPadding = false }) => {
  // Persist collapse preference across sessions
  const [collapsed, setCollapsed]   = useLocalStorage("sidebar-collapsed", false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* ── Right panel ──────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          onMobileMenuOpen={() => setMobileOpen(true)}
          pageTitle={pageTitle}
        />

        {/* Scrollable content area */}
        <main className={`flex-1 overflow-y-auto ${noPadding ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}`}>
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default SidebarLayout;