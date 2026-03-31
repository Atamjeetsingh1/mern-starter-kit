/**
 * components/ui/Pagination.jsx
 * Works hand-in-hand with the usePagination hook.
 *
 * Usage:
 *   const pagination = usePagination({ total, initialLimit: 10 });
 *   <Pagination {...pagination} />
 */

import React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "../components/IconCollection";

const Pagination = ({
  page,
  totalPages,
  total,
  limit,
  paginationRange,
  DOTS,
  setPage,
  setLimit,
  canPrev,
  canNext,
  nextPage,
  prevPage,
  showLimitSelect = true,
  limitOptions    = [10, 20, 50, 100],
}) => {
  if (totalPages <= 1 && total <= limit) return null;

  const btnBase =
    "inline-flex items-center justify-center h-8 w-8 rounded-lg text-sm font-medium transition-colors";
  const btnActive =
    "bg-indigo-600 text-white shadow-sm";
  const btnDefault =
    "text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3">
      {/* Left: row count info */}
      <p className="text-sm text-gray-500 order-2 sm:order-1">
        Showing{" "}
        <span className="font-medium text-gray-700">
          {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)}
        </span>{" "}
        of <span className="font-medium text-gray-700">{total}</span>
      </p>

      {/* Center: page buttons */}
      <nav
        aria-label="Pagination"
        className="flex items-center gap-1 order-1 sm:order-2"
      >
        {/* Prev */}
        <button
          onClick={prevPage}
          disabled={!canPrev}
          aria-label="Previous page"
          className={`${btnBase} ${btnDefault}`}
        >
          <ChevronLeftIcon size={16} />
        </button>

        {paginationRange.map((pageNum, idx) =>
          pageNum === DOTS ? (
            <span
              key={`dots-${idx}`}
              className="h-8 w-8 flex items-center justify-center text-gray-400 text-sm select-none"
            >
              …
            </span>
          ) : (
            <button
              key={pageNum}
              onClick={() => setPage(pageNum)}
              aria-current={pageNum === page ? "page" : undefined}
              className={`${btnBase} ${pageNum === page ? btnActive : btnDefault}`}
            >
              {pageNum}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={nextPage}
          disabled={!canNext}
          aria-label="Next page"
          className={`${btnBase} ${btnDefault}`}
        >
          <ChevronRightIcon size={16} />
        </button>
      </nav>

      {/* Right: rows-per-page */}
      {showLimitSelect && (
        <div className="flex items-center gap-2 order-3 text-sm text-gray-500">
          <span>Rows</span>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {limitOptions.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default Pagination;