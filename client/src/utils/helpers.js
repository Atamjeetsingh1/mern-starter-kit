/**
 * utils/helpers.js
 * General-purpose utilities that don't belong in formatters or validators.
 * Pure functions — no side effects, no imports.
 */

// ── Object helpers ─────────────────────────────────────────────────────────

/**
 * Deep clone a JSON-serialisable object (no functions or circular refs).
 * Faster than structuredClone for simple objects, no lodash needed.
 */
export const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

/**
 * Pick specific keys from an object.
 * @example pick({ a:1, b:2, c:3 }, ["a","c"]) → { a:1, c:3 }
 */
export const pick = (obj, keys) =>
  Object.fromEntries(keys.filter((k) => k in obj).map((k) => [k, obj[k]]));

/**
 * Omit specific keys from an object.
 * @example omit({ a:1, b:2, c:3 }, ["b"]) → { a:1, c:3 }
 */
export const omit = (obj, keys) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));

/**
 * Flatten a nested object into dot-notation keys.
 * @example flatten({ a: { b: { c: 1 } } }) → { "a.b.c": 1 }
 */
export const flattenObject = (obj, prefix = "") => {
  return Object.entries(obj).reduce((acc, [key, val]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
      Object.assign(acc, flattenObject(val, fullKey));
    } else {
      acc[fullKey] = val;
    }
    return acc;
  }, {});
};

/**
 * Group an array of objects by a key.
 * @example groupBy(users, "role") → { customer: [...], provider: [...] }
 */
export const groupBy = (arr, key) =>
  arr.reduce((acc, item) => {
    const group = typeof key === "function" ? key(item) : item[key];
    acc[group] = acc[group] ?? [];
    acc[group].push(item);
    return acc;
  }, {});

/**
 * Sort an array of objects by a key (asc/desc).
 */
export const sortBy = (arr, key, direction = "asc") => {
  return [...arr].sort((a, b) => {
    const va = a[key] ?? "";
    const vb = b[key] ?? "";
    const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
    return direction === "asc" ? cmp : -cmp;
  });
};

/**
 * Remove duplicate values from an array.
 * @example unique([1,2,2,3]) → [1,2,3]
 * @example uniqueBy(users, "email")
 */
export const unique = (arr) => [...new Set(arr)];
export const uniqueBy = (arr, key) => {
  const seen = new Set();
  return arr.filter((item) => {
    const val = item[key];
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
};

/**
 * Chunk an array into groups of `size`.
 * @example chunk([1,2,3,4,5], 2) → [[1,2],[3,4],[5]]
 */
export const chunk = (arr, size) => {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

// ── String helpers ─────────────────────────────────────────────────────────

/** Convert a string to slug format */
export const toSlug = (str = "") =>
  str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Generate a random alphanumeric ID (client-side only, not cryptographic) */
export const randomId = (length = 8) =>
  Math.random().toString(36).slice(2, 2 + length);

/** Check if a string is a valid URL */
export const isValidUrl = (str) => {
  try { new URL(str); return true; }
  catch { return false; }
};

/** Check if a string is a valid email */
export const isValidEmail = (str) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

// ── Number helpers ─────────────────────────────────────────────────────────

/** Clamp a number between min and max */
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/** Generate a random integer between min and max (inclusive) */
export const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/** Round to a specific number of decimal places */
export const round = (num, decimals = 2) =>
  Math.round(num * 10 ** decimals) / 10 ** decimals;

// ── Function helpers ───────────────────────────────────────────────────────


/**
 * Retry an async function up to `maxAttempts` times with exponential back-off.
 */
export const retry = async (fn, maxAttempts = 3, baseDelayMs = 300) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** (attempt - 1)));
    }
  }
};

/**
 * Sleep for `ms` milliseconds.
 * @example await sleep(500);
 */
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Browser helpers ────────────────────────────────────────────────────────

/** Scroll smoothly to an element by ID */
export const scrollToId = (id, offset = 80) => {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: "smooth" });
};

/** Check if the device is touch-capable */
export const isTouchDevice = () =>
  "ontouchstart" in window || navigator.maxTouchPoints > 0;

/** Get query params as a plain object */
export const getQueryParams = (search = window.location.search) =>
  Object.fromEntries(new URLSearchParams(search).entries());

/** Build a query string from an object (skips null/undefined) */
export const buildQueryString = (params) => {
  const qs = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val != null && val !== "") qs.set(key, String(val));
  }
  const str = qs.toString();
  return str ? `?${str}` : "";
};