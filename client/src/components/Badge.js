/**
 * components/ui/Badge.jsx
 * Small coloured label — roles, statuses, tags, counts.
 *
 * Usage:
 *   <Badge color="green">Active</Badge>
 *   <Badge color="red" dot>Offline</Badge>
 *   <Badge color="indigo" size="lg">Provider</Badge>
 */

import React from "react";

const COLORS = {
  gray:   "bg-gray-100   text-gray-700   border-gray-200",
  indigo: "bg-indigo-50  text-indigo-700 border-indigo-200",
  green:  "bg-green-50   text-green-700  border-green-200",
  red:    "bg-red-50     text-red-700    border-red-200",
  yellow: "bg-yellow-50  text-yellow-700 border-yellow-200",
  blue:   "bg-blue-50    text-blue-700   border-blue-200",
  purple: "bg-purple-50  text-purple-700 border-purple-200",
  pink:   "bg-pink-50    text-pink-700   border-pink-200",
  orange: "bg-orange-50  text-orange-700 border-orange-200",
};

const DOT_COLORS = {
  gray:   "bg-gray-400",
  indigo: "bg-indigo-500",
  green:  "bg-green-500",
  red:    "bg-red-500",
  yellow: "bg-yellow-400",
  blue:   "bg-blue-500",
  purple: "bg-purple-500",
  pink:   "bg-pink-500",
  orange: "bg-orange-500",
};

const SIZES = {
  sm: "px-1.5 py-0.5 text-[11px]",
  md: "px-2   py-0.5 text-xs",
  lg: "px-2.5 py-1   text-sm",
};

const Badge = ({
  children,
  color   = "gray",
  size    = "md",
  dot     = false,
  rounded = "full",
  className = "",
}) => {
  const colorClass = COLORS[color]    ?? COLORS.gray;
  const sizeClass  = SIZES[size]      ?? SIZES.md;
  const dotColor   = DOT_COLORS[color] ?? DOT_COLORS.gray;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium border
        rounded-${rounded}
        ${colorClass} ${sizeClass} ${className}
      `}
    >
      {dot && (
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} />
      )}
      {children}
    </span>
  );
};

export default Badge;