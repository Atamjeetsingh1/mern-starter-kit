/**
 * components/ui/Breadcrumb.jsx
 * Navigation breadcrumb trail.
 *
 * Usage:
 *   <Breadcrumb
 *     items={[
 *       { label: "Dashboard", href: "/dashboard" },
 *       { label: "Users",     href: "/users" },
 *       { label: "Jane Doe" },          // last item has no href = current page
 *     ]}
 *   />
 */

import React from "react";
import { Link } from "react-router-dom";
import { ChevronRightIcon } from "../components/IconCollection";

const Breadcrumb = ({ items = [] }) => (
  <nav aria-label="Breadcrumb">
    <ol className="flex flex-wrap items-center gap-1 text-sm">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRightIcon
                size={14}
                className="text-gray-300 shrink-0"
                aria-hidden="true"
              />
            )}
            {isLast || !item.href ? (
              <span
                aria-current={isLast ? "page" : undefined}
                className={isLast ? "font-medium text-gray-800" : "text-gray-500"}
              >
                {item.label}
              </span>
            ) : (
              <Link
                to={item.href}
                className="text-gray-500 hover:text-indigo-600 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  </nav>
);

export default Breadcrumb;
