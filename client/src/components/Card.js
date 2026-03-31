/**
 * components/ui/Card.jsx
 * Consistent white card shell used across dashboards and detail pages.
 *
 * Usage:
 *   <Card>plain content</Card>
 *   <Card title="Users" action={<Button>Add</Button>} footer={<Pagination ... />}>
 *     <Table ... />
 *   </Card>
 */

import React from "react";

const Card = ({
  children,
  title,
  subtitle,
  action,
  footer,
  noPadding = false,
  className = "",
}) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>
    {/* Header */}
    {(title || action) && (
      <div className="flex items-start justify-between px-6 py-4 border-b border-gray-50">
        <div>
          {title && (
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && <div className="ml-4 shrink-0">{action}</div>}
      </div>
    )}

    {/* Body */}
    <div className={noPadding ? "" : "px-6 py-5"}>{children}</div>

    {/* Footer */}
    {footer && (
      <div className="px-6 py-3 border-t border-gray-50">{footer}</div>
    )}
  </div>
);

export default Card;