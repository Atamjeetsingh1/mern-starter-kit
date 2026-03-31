/**
 * components/ui/EmptyState.jsx
 * Friendly placeholder for empty lists, search results, or error states.
 *
 * Usage:
 *   <EmptyState
 *     icon={<UsersIcon size={40} />}
 *     title="No users found"
 *     description="Try adjusting your filters."
 *     action={<Button onClick={resetFilters}>Clear filters</Button>}
 *   />
 */

import React from "react";

const EmptyState = ({
  icon,
  title       = "Nothing here yet",
  description,
  action,
  className   = "",
}) => (
  <div
    className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
  >
    {icon && (
      <div className="mb-4 text-gray-300">{icon}</div>
    )}
    <h3 className="text-base font-semibold text-gray-700">{title}</h3>
    {description && (
      <p className="mt-1 text-sm text-gray-400 max-w-xs">{description}</p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;