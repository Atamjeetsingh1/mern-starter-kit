/**
 * hooks/useClickOutside.js
 * Calls `handler` when a click occurs outside the referenced element.
 * Used by dropdowns, modals, sidebars, etc.
 *
 * Usage:
 *   const ref = useClickOutside(() => setOpen(false));
 *   <div ref={ref}>...</div>
 */

import { useEffect, useRef } from "react";

const useClickOutside = (handler) => {
  const ref = useRef(null);

  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };

    document.addEventListener("mousedown",  listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown",  listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [handler]);

  return ref;
};

export default useClickOutside;