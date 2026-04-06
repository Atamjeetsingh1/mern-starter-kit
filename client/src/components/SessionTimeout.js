/**
 * components/ui/SessionTimeout.jsx
 * ──────────────────────────────────
 * Shows a modal warning when the user has been idle for IDLE_MINUTES.
 * Gives them WARN_SECONDS to continue before logging them out.
 *
 * Usage: Mount once in SidebarLayout or App.jsx.
 *   <SessionTimeout />
 */

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate }   from "react-router-dom";
import useIdle           from "../hooks/useIdle";
import useCountdown      from "../hooks/useCountdown";
import useAuth           from "../hooks/useAuth";
import Modal             from "../components/Modal";
import Button            from "../components/Button";
import { ROUTES }        from "../constants";

const IDLE_MS       = 25 * 60 * 1000;  // Show warning after 25 min idle
const WARN_SECONDS  = 60;              // Auto-logout after 60 more seconds

const SessionTimeout = () => {
  const isIdle    = useIdle(IDLE_MS);
  const [show, setShow] = useState(false);
  const navigate  = useNavigate();
  const { logout, isAuthenticated } = useAuth();

  const handleLogout = useCallback(async () => {
    setShow(false);
    await logout();
    navigate(ROUTES.LOGIN, {
      state: { message: "You were logged out due to inactivity." },
    });
  }, [logout, navigate]);

  const { remaining, start, stop, reset } = useCountdown(WARN_SECONDS, handleLogout);

  // Show warning when idle kicks in
  useEffect(() => {
    if (isIdle && isAuthenticated && !show) {
      setShow(true);
      start();
    }
  }, [isIdle, isAuthenticated, show, start]);

  const handleContinue = () => {
    setShow(false);
    stop();
    reset();
  };

  if (!isAuthenticated) return null;

  return (
    <Modal
      isOpen={show}
      onClose={handleContinue}
      title="Still there?"
      size="sm"
      closeOnBackdrop={false}
    >
      <div className="space-y-5">
        {/* Countdown ring */}
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="relative h-20 w-20">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9"
                fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="15.9"
                fill="none" stroke="#4f46e5" strokeWidth="2.5"
                strokeDasharray={`${(remaining / WARN_SECONDS) * 100} 100`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-900 tabular-nums">{remaining}</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">
              You've been inactive. For your security, we'll log you out in{" "}
              <strong className="text-gray-900">{remaining} second{remaining !== 1 ? "s" : ""}</strong>.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={handleLogout}>
            Log out now
          </Button>
          <Button fullWidth onClick={handleContinue}>
            Stay logged in
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SessionTimeout;