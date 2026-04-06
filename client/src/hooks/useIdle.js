/**
 * hooks/useIdle.js
 * Detects when the user has been inactive for `timeoutMs` milliseconds.
 * Use for session timeout warnings, auto-save pausing, analytics, etc.
 *
 * Usage:
 *   const isIdle = useIdle(5 * 60 * 1000); // 5 minutes
 *   useEffect(() => {
 *     if (isIdle) showSessionWarning();
 *   }, [isIdle]);
 */

import { useState, useEffect, useRef, useCallback } from "react";

const ACTIVITY_EVENTS = [
  "mousemove", "mousedown", "keydown",
  "touchstart", "scroll", "wheel", "click",
];

const useIdle = (timeoutMs = 5 * 60 * 1000) => {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef(null);

  const resetTimer = useCallback(() => {
    setIsIdle(false);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsIdle(true), timeoutMs);
  }, [timeoutMs]);

  useEffect(() => {
    // Start timer and add listeners
    resetTimer();
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, resetTimer, { passive: true })
    );
    return () => {
      clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
    };
  }, [resetTimer]);

  return isIdle;
};

export default useIdle;