/**
 * components/ui/OfflineBanner.jsx
 * ─────────────────────────────────
 * Shows a sticky banner when the user loses network connectivity.
 * Automatically disappears and shows a "Back online" flash when reconnected.
 *
 * Usage: Drop inside SidebarLayout or App.jsx.
 *   <OfflineBanner />
 */

import React, { useEffect, useState } from "react";
import useOnlineStatus from "../hooks/useOnlineStatus";

const OfflineBanner = () => {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);

  // Flash "back online" for 3 s when reconnected
  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      const t = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(t);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        fixed bottom-4 left-1/2 -translate-x-1/2 z-[9997]
        flex items-center gap-2.5 px-5 py-2.5 rounded-full shadow-lg
        text-sm font-medium transition-all duration-300
        ${isOnline
          ? "bg-green-600 text-white"
          : "bg-gray-900 text-white"}
      `}
    >
      {isOnline ? (
        <>
          <span className="h-2 w-2 rounded-full bg-green-300 animate-pulse" />
          Back online
        </>
      ) : (
        <>
          {/* Animated offline icon */}
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 3l18 18M8.111 8.111A7.5 7.5 0 0119.5 12M4.5 12a7.5 7.5 0 014.118-6.662M12 12a2.25 2.25 0 012.25 2.25" />
          </svg>
          No internet connection
        </>
      )}
    </div>
  );
};

export default OfflineBanner;