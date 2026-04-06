/**
 * hooks/useOnlineStatus.js
 * Returns { isOnline, wasOffline } — tracks network connectivity.
 * wasOffline is true if the user was offline at any point this session,
 * useful for showing "Back online — syncing…" indicators.
 *
 * Usage:
 *   const { isOnline } = useOnlineStatus();
 *   if (!isOnline) return <OfflineBanner />;
 */

import { useState, useEffect, useRef } from "react";

const useOnlineStatus = () => {
  const [isOnline,   setIsOnline]   = useState(navigator.onLine);
  const wasOfflineRef = useRef(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const goOnline  = () => {
      setIsOnline(true);
      if (wasOfflineRef.current) setWasOffline(true);
    };
    const goOffline = () => {
      setIsOnline(false);
      wasOfflineRef.current = true;
    };

    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online",  goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return { isOnline, wasOffline };
};

export default useOnlineStatus;