/**
 * components/ui/SearchBar.jsx
 * Input with built-in search icon, clear button, and optional debounce.
 *
 * Usage:
 *   <SearchBar
 *     value={query}
 *     onChange={setQuery}
 *     placeholder="Search users…"
 *     debounce={400}
 *   />
 */

import React, { useState, useEffect } from "react";
import { SearchIcon, CloseIcon } from "../components/IconCollection";

const SearchBar = ({
  value: externalValue,
  onChange,
  placeholder = "Search…",
  debounce    = 0,
  className   = "",
  autoFocus   = false,
}) => {
  // If debounce > 0 we manage an internal value and call onChange after delay
  const [internal, setInternal] = useState(externalValue ?? "");

  // Keep internal in sync if the parent controls the value
  useEffect(() => {
    setInternal(externalValue ?? "");
  }, [externalValue]);

  useEffect(() => {
    if (!debounce) return;
    const timer = setTimeout(() => onChange?.(internal), debounce);
    return () => clearTimeout(timer);
  }, [internal, debounce, onChange]);

  const handleChange = (e) => {
    const v = e.target.value;
    if (debounce) {
      setInternal(v);
    } else {
      setInternal(v);
      onChange?.(v);
    }
  };

  const clear = () => {
    setInternal("");
    onChange?.("");
  };

  const currentValue = debounce ? internal : (externalValue ?? internal);

  return (
    <div className={`relative flex items-center ${className}`}>
      {/* Search icon */}
      <SearchIcon
        size={16}
        className="absolute left-3 text-gray-400 pointer-events-none"
      />

      <input
        type="search"
        value={currentValue}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="
          w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-gray-200
          bg-white placeholder:text-gray-400 text-gray-800
          focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400
          transition-colors
        "
      />

      {/* Clear button */}
      {currentValue && (
        <button
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-2.5 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <CloseIcon size={14} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;