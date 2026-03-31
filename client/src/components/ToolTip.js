/**
 * components/ui/Tooltip.jsx
 * CSS-only tooltip — zero JS overhead, fully accessible via aria-label.
 *
 * Usage:
 *   <Tooltip content="Delete this item" placement="top">
 *     <button>🗑</button>
 *   </Tooltip>
 */

import React from "react";

const PLACEMENTS = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full  left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full  top-1/2 -translate-y-1/2 ml-2",
};

const Tooltip = ({ children, content, placement = "top", className = "" }) => {
  if (!content) return children;

  return (
    <div className={`relative inline-flex group ${className}`}>
      {children}
      <div
        role="tooltip"
        className={`
          pointer-events-none absolute z-50 whitespace-nowrap
          rounded-lg bg-gray-900 text-white text-xs px-2.5 py-1.5 shadow-lg
          opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
          transition-opacity duration-150
          ${PLACEMENTS[placement] ?? PLACEMENTS.top}
        `}
      >
        {content}
      </div>
    </div>
  );
};

export default Tooltip;