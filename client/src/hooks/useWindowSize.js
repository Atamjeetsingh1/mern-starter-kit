/**
 * hooks/useWindowSize.js
 * Returns current window dimensions, updated on resize.
 * Used for responsive logic that CSS can't handle alone
 * (e.g. conditionally rendering components based on breakpoint).
 *
 * Usage:
 *   const { width, height, isMobile, isTablet, isDesktop } = useWindowSize();
 */

import { useState, useEffect } from "react";

const BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280 };

const useWindowSize = () => {
  const [size, setSize] = useState({
    width:  window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    let rafId;
    const handleResize = () => {
      // Use rAF to debounce rapid resize events
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setSize({ width: window.innerWidth, height: window.innerHeight });
      });
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return {
    width:     size.width,
    height:    size.height,
    isMobile:  size.width < BREAKPOINTS.md,
    isTablet:  size.width >= BREAKPOINTS.md && size.width < BREAKPOINTS.lg,
    isDesktop: size.width >= BREAKPOINTS.lg,
  };
};

export default useWindowSize;