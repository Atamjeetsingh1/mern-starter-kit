/**
 * hooks/useDebounce.js
 * Delays updating a value until the user stops changing it for `delay` ms.
 * Perfect for search inputs — avoids an API call on every keystroke.
 *
 * Usage:
 *   const debouncedSearch = useDebounce(searchQuery, 400);
 *   useEffect(() => { fetchResults(debouncedSearch); }, [debouncedSearch]);
 */

import { useState, useEffect } from "react";

/**
 * @template T
 * @param {T}      value - The value to debounce
 * @param {number} delay - Milliseconds to wait (default 400ms)
 * @returns {T} The debounced value
 */
const useDebounce = (value, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    // Cleanup: cancel the timer if value changes before delay elapses
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;