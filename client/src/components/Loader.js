/**
 * components/Loader.jsx
 * Flexible loading indicator — inline spinner or full-screen overlay.
 *
 * Usage:
 *   <Loader />                          // Inline centered spinner
 *   <Loader fullScreen />               // Full-page overlay
 *   <Loader size="lg" label="Saving…" />
 */

import React from "react";

const SIZES = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-[3px]",
  xl: "h-16 w-16 border-4",
};

const Loader = ({
  size       = "md",
  label      = "Loading…",
  fullScreen = false,
  className  = "",
}) => {
  const spinner = (
    <div
      role="status"
      aria-label={label}
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <div
        className={`
          ${SIZES[size] ?? SIZES.md}
          animate-spin rounded-full
          border-indigo-200
          border-t-indigo-600
        `}
      />
      {label && (
        <span className="text-sm text-gray-500 sr-only sm:not-sr-only">
          {label}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default Loader;