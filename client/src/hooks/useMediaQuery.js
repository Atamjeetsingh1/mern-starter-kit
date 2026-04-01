/**
 * hooks/useMediaQuery.js
 * Returns true when the given CSS media query matches.
 *
 * Usage:
 *   const isMobile  = useMediaQuery("(max-width: 767px)");
 *   const isDark    = useMediaQuery("(prefers-color-scheme: dark)");
 *   const isReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
 */

import { useState, useEffect } from "react";

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql     = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);

    // Modern API
    if (mql.addEventListener) {
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }
    // Legacy API (Safari < 14)
    mql.addListener(handler);
    return () => mql.removeListener(handler);
  }, [query]);

  return matches;
};

export default useMediaQuery;