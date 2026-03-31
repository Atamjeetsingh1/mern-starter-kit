/**
 * hooks/usePagination.js
 * Manages pagination state and generates the page number array for UI rendering.
 *
 * Usage:
 *   const { page, limit, setPage, setLimit, paginationRange } =
 *     usePagination({ total: 95, initialLimit: 10 });
 */

import { useState, useMemo } from "react";

const DOTS = "...";

/**
 * Build the array of page numbers to display, e.g. [1, "...", 4, 5, 6, "...", 12]
 * @param {number} currentPage
 * @param {number} totalPages
 * @param {number} siblingCount  Number of pages shown on each side of current page
 */
const buildRange = (currentPage, totalPages, siblingCount = 1) => {
  const totalPageNumbers = siblingCount * 2 + 5; // siblings + first + last + 2 dots

  // Case 1: Not enough pages to need dots — show all
  if (totalPageNumbers >= totalPages) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex  = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const showLeftDots  = leftSiblingIndex  > 2;
  const showRightDots = rightSiblingIndex < totalPages - 2;

  const firstPage = 1;
  const lastPage  = totalPages;

  // Case 2: No left dots, but right dots
  if (!showLeftDots && showRightDots) {
    const leftRange = Array.from({ length: 3 + 2 * siblingCount }, (_, i) => i + 1);
    return [...leftRange, DOTS, lastPage];
  }

  // Case 3: No right dots, but left dots
  if (showLeftDots && !showRightDots) {
    const rightCount = 3 + 2 * siblingCount;
    const rightRange = Array.from({ length: rightCount }, (_, i) => totalPages - rightCount + i + 1);
    return [firstPage, DOTS, ...rightRange];
  }

  // Case 4: Both dots
  const middleRange = Array.from(
    { length: rightSiblingIndex - leftSiblingIndex + 1 },
    (_, i) => leftSiblingIndex + i
  );
  return [firstPage, DOTS, ...middleRange, DOTS, lastPage];
};

/**
 * @param {{ total: number, initialPage?: number, initialLimit?: number, siblingCount?: number }} options
 */
const usePagination = ({
  total         = 0,
  initialPage   = 1,
  initialLimit  = 10,
  siblingCount  = 1,
} = {}) => {
  const [page,  setPage]  = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Clamp page when total or limit changes
  const safePage = Math.min(page, totalPages);

  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));
  const nextPage = () => goToPage(safePage + 1);
  const prevPage = () => goToPage(safePage - 1);

  const changeLimit = (newLimit) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when limit changes
  };

  const paginationRange = useMemo(
    () => buildRange(safePage, totalPages, siblingCount),
    [safePage, totalPages, siblingCount]
  );

  return {
    page: safePage,
    limit,
    totalPages,
    total,
    setPage: goToPage,
    setLimit: changeLimit,
    nextPage,
    prevPage,
    canPrev: safePage > 1,
    canNext: safePage < totalPages,
    paginationRange,
    DOTS,
    // Offset for API calls: ?skip=X&limit=Y
    offset: (safePage - 1) * limit,
  };
};

export default usePagination;