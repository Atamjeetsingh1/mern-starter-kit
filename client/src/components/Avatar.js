/**
 * components/ui/Avatar.jsx
 * User avatar — shows image if available, falls back to initials.
 *
 * Usage:
 *   <Avatar name="Jane Doe" src={user.avatarUrl} size="md" />
 *   <AvatarGroup users={[user1, user2, user3]} max={4} />
 */

import React from "react";

const SIZES = {
  xs: "h-6  w-6  text-[10px]",
  sm: "h-8  w-8  text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
};

const BG_PALETTE = [
  "bg-red-200    text-red-800",
  "bg-orange-200 text-orange-800",
  "bg-yellow-200 text-yellow-800",
  "bg-green-200  text-green-800",
  "bg-teal-200   text-teal-800",
  "bg-blue-200   text-blue-800",
  "bg-indigo-200 text-indigo-800",
  "bg-purple-200 text-purple-800",
  "bg-pink-200   text-pink-800",
];

/** Deterministic colour from the user's name */
const getColor = (name = "") => {
  const code = name.charCodeAt(0) || 0;
  return BG_PALETTE[code % BG_PALETTE.length];
};

/** Extract initials from full name */
const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
};

// ── Avatar ─────────────────────────────────────────────────────────────────
const Avatar = ({
  name      = "",
  src,
  size      = "md",
  className = "",
  online,
}) => {
  const sizeClass = SIZES[size] ?? SIZES.md;
  const colorClass = getColor(name);

  return (
    <div className={`relative shrink-0 ${className}`}>
      <div
        className={`
          ${sizeClass} ${colorClass}
          rounded-full flex items-center justify-center
          font-semibold select-none overflow-hidden
        `}
        title={name}
        aria-label={name}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="h-full w-full object-cover rounded-full"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        ) : (
          getInitials(name)
        )}
      </div>

      {/* Online indicator */}
      {online !== undefined && (
        <span
          aria-label={online ? "Online" : "Offline"}
          className={`
            absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full
            border-2 border-white
            ${online ? "bg-green-400" : "bg-gray-300"}
          `}
        />
      )}
    </div>
  );
};

// ── AvatarGroup ─────────────────────────────────────────────────────────────
export const AvatarGroup = ({ users = [], max = 4, size = "sm" }) => {
  const visible  = users.slice(0, max);
  const overflow = users.length - max;
  const sizeClass = SIZES[size] ?? SIZES.sm;

  return (
    <div className="flex -space-x-2">
      {visible.map((u, i) => (
        <Avatar
          key={u._id ?? u.id ?? i}
          name={u.name}
          src={u.avatar}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {overflow > 0 && (
        <div
          className={`
            ${sizeClass} bg-gray-200 text-gray-600
            rounded-full flex items-center justify-center
            font-semibold text-[11px] ring-2 ring-white
          `}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
};

export default Avatar;