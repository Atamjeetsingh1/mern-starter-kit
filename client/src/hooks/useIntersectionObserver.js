/**
 * hooks/useIntersectionObserver.js
 * Tells you when an element enters the viewport.
 * Use for: lazy loading images, infinite scroll triggers,
 * scroll-based animations, analytics impression tracking.
 *
 * Usage:
 *   // Infinite scroll
 *   const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.1 });
 *   useEffect(() => { if (isIntersecting && hasMore) fetchNextPage(); }, [isIntersecting]);
 *   <div ref={ref} />   ← put at the bottom of your list
 *
 *   // Lazy image
 *   const { ref, isIntersecting } = useIntersectionObserver({ triggerOnce: true });
 *   <img ref={ref} src={isIntersecting ? src : undefined} alt="" />
 */

import { useState, useEffect, useRef, useCallback } from "react";

const useIntersectionObserver = ({
  threshold    = 0,
  rootMargin   = "0px",
  triggerOnce  = false,   // Stop observing after first intersection
} = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState(null);
  const observerRef = useRef(null);
  const elementRef  = useRef(null);

  const ref = useCallback((node) => {
    // Disconnect the old observer when the ref target changes
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (!node) return;

    elementRef.current = node;

    observerRef.current = new IntersectionObserver(
      ([e]) => {
        setIsIntersecting(e.isIntersecting);
        setEntry(e);

        if (e.isIntersecting && triggerOnce) {
          observerRef.current?.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observerRef.current.observe(node);
  }, [threshold, rootMargin, triggerOnce]);

  // Cleanup on unmount
  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { ref, isIntersecting, entry };
};

export default useIntersectionObserver;