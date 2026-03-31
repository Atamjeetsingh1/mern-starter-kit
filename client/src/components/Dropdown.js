/**
 * components/ui/Dropdown.jsx
 * Accessible dropdown menu triggered by a custom trigger element.
 *
 * Usage:
 *   <Dropdown
 *     trigger={<Button>Options</Button>}
 *     items={[
 *       { label: "Edit",   icon: <EditIcon />, onClick: handleEdit },
 *       { label: "Delete", icon: <TrashIcon />, onClick: handleDelete, danger: true },
 *       { divider: true },
 *       { label: "View profile", href: "/profile" },
 *     ]}
 *   />
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import useClickOutside from "../hooks/useClickOutside";

const ALIGNMENTS = {
  left:  "left-0",
  right: "right-0",
};

const Dropdown = ({
  trigger,
  items       = [],
  align       = "left",
  minWidth    = "180px",
  className   = "",
}) => {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));

  const close = () => setOpen(false);

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      {/* Trigger */}
      <div onClick={() => setOpen((v) => !v)} className="cursor-pointer">
        {trigger}
      </div>

      {/* Menu */}
      {open && (
        <div
          role="menu"
          className={`
            absolute z-50 mt-1.5 py-1
            bg-white rounded-xl border border-gray-100 shadow-xl
            ${ALIGNMENTS[align] ?? ALIGNMENTS.left}
          `}
          style={{ minWidth }}
        >
          {items.map((item, i) => {
            // Divider
            if (item.divider) {
              return <hr key={`div-${i}`} className="my-1 border-gray-100" />;
            }

            const baseClass = `
              flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm
              transition-colors rounded-none first:rounded-t-lg last:rounded-b-lg
              ${item.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
              ${item.danger
                ? "text-red-600 hover:bg-red-50"
                : "text-gray-700 hover:bg-gray-50"}
            `;

            // External / internal link
            if (item.href) {
              return (
                <Link
                  key={i}
                  to={item.href}
                  role="menuitem"
                  className={baseClass}
                  onClick={close}
                >
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  {item.label}
                </Link>
              );
            }

            return (
              <button
                key={i}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => { if (!item.disabled) { item.onClick?.(); close(); } }}
                className={baseClass}
              >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                {item.label}
                {item.badge && (
                  <span className="ml-auto bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dropdown;