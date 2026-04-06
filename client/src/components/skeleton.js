/**
 * components/ui/Skeleton.jsx
 * Animated loading placeholders — replaces spinners for content areas.
 * Far better UX: user sees the shape of the content before it loads.
 *
 * Usage:
 *   <Skeleton width="w-full" height="h-4" />
 *   <Skeleton.Card />
 *   <Skeleton.Table rows={5} cols={4} />
 *   <Skeleton.Avatar size="md" />
 */

import React from "react";

// ── Base skeleton block ────────────────────────────────────────────────────
const Skeleton = ({
  width     = "w-full",
  height    = "h-4",
  rounded   = "rounded-md",
  className = "",
}) => (
  <div
    aria-hidden="true"
    className={`animate-pulse bg-gray-200 ${width} ${height} ${rounded} ${className}`}
  />
);

// ── Pre-built compound skeletons ───────────────────────────────────────────

/** Card skeleton — header + lines */
Skeleton.Card = ({ lines = 3 } = {}) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4" aria-busy="true" aria-label="Loading">
    <div className="flex items-center gap-3">
      <Skeleton width="w-10" height="h-10" rounded="rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton height="h-4" width="w-1/3" />
        <Skeleton height="h-3" width="w-1/4" />
      </div>
    </div>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} height="h-3" width={i === lines - 1 ? "w-2/3" : "w-full"} />
    ))}
  </div>
);

/** Table skeleton */
Skeleton.Table = ({ rows = 5, cols = 4 } = {}) => (
  <div className="space-y-2" aria-busy="true" aria-label="Loading table">
    {/* Header */}
    <div className="flex gap-4 px-4 py-2">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} height="h-3" width="w-full" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex gap-4 px-4 py-3 bg-white rounded-lg">
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={c} height="h-4" width={c === 0 ? "w-1/4" : "w-full"} />
        ))}
      </div>
    ))}
  </div>
);

/** Avatar skeleton */
Skeleton.Avatar = ({ size = "md" } = {}) => {
  const sizes = { xs: "h-6 w-6", sm: "h-8 w-8", md: "h-10 w-10", lg: "h-12 w-12", xl: "h-16 w-16" };
  return <Skeleton width={sizes[size]} height={sizes[size]} rounded="rounded-full" />;
};

/** User list item skeleton */
Skeleton.UserRow = () => (
  <div className="flex items-center gap-3 p-3">
    <Skeleton.Avatar size="md" />
    <div className="flex-1 space-y-1.5">
      <Skeleton height="h-4" width="w-1/3" />
      <Skeleton height="h-3" width="w-1/2" />
    </div>
    <Skeleton height="h-6" width="w-16" rounded="rounded-full" />
  </div>
);

/** Stat card skeleton */
Skeleton.StatCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-start gap-4">
    <Skeleton width="w-12" height="h-12" rounded="rounded-xl" />
    <div className="space-y-2 flex-1">
      <Skeleton height="h-3" width="w-1/2" />
      <Skeleton height="h-7" width="w-1/3" />
    </div>
  </div>
);

export default Skeleton;