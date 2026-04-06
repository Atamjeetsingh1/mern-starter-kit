/**
 * components/ui/Accordion.jsx
 * Expandable / collapsible sections. Each item can be open independently
 * or in "exclusive" mode (only one open at a time — like an FAQ).
 *
 * Usage:
 *   <Accordion
 *     items={[
 *       { id: "q1", title: "What is MERN?",  content: <p>...</p> },
 *       { id: "q2", title: "How to deploy?", content: "..." },
 *     ]}
 *     exclusive
 *     defaultOpen="q1"
 *   />
 *
 *   // Or uncontrolled single panel:
 *   <AccordionItem title="Advanced options">...</AccordionItem>
 */

import React, { useState } from "react";
import { Icon } from "../components/IconCollection";

// ── Single panel ──────────────────────────────────────────────────────────
export const AccordionItem = ({
  title,
  children,
  isOpen,
  onToggle,
  icon,
  badge,
  disabled  = false,
  className = "",
}) => (
  <div className={`border border-gray-100 rounded-xl overflow-hidden ${className}`}>
    {/* Header */}
    <button
      type="button"
      onClick={disabled ? undefined : onToggle}
      disabled={disabled}
      aria-expanded={isOpen}
      className={`
        w-full flex items-center justify-between gap-3
        px-5 py-4 text-left bg-white
        hover:bg-gray-50 transition-colors duration-150
        ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
      `}
    >
      <div className="flex items-center gap-3 min-w-0">
        {icon && <span className="shrink-0 text-gray-400">{icon}</span>}
        <span className="text-sm font-semibold text-gray-900 truncate">{title}</span>
        {badge != null && (
          <span className="shrink-0 bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <Icon
        name="chevronDown"
        size={16}
        className={`text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
      />
    </button>

    {/* Body — CSS-driven expand/collapse */}
    <div
      className={`overflow-hidden transition-all duration-200 ease-in-out ${
        isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
      }`}
    >
      <div className="px-5 pb-5 pt-1 bg-white border-t border-gray-50 text-sm text-gray-600 leading-relaxed">
        {children}
      </div>
    </div>
  </div>
);

// ── Group ──────────────────────────────────────────────────────────────────
const Accordion = ({
  items       = [],
  exclusive   = false,  // Only one open at a time
  defaultOpen = null,   // id or array of ids
  className   = "",
}) => {
  const [openIds, setOpenIds] = useState(() => {
    if (!defaultOpen) return new Set();
    return new Set(Array.isArray(defaultOpen) ? defaultOpen : [defaultOpen]);
  });

  const toggle = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (exclusive) next.clear();
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          title={item.title}
          isOpen={openIds.has(item.id)}
          onToggle={() => toggle(item.id)}
          icon={item.icon}
          badge={item.badge}
          disabled={item.disabled}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
};

export default Accordion;