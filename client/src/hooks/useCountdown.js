/**
 * hooks/useCountdown.js
 * Countdown timer hook with start/stop/reset controls.
 */

import { useState, useCallback, useRef, useEffect } from "react";

export const useCountdown = (initialSeconds, onComplete) => {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          setIsRunning(false);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [isRunning, onComplete]);

  const stop = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setRemaining(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    return () => clearTimer();
  }, []);

  return { remaining, isRunning, start, stop, reset };
};

export default useCountdown;
