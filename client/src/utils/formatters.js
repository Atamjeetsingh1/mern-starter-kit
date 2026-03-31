/**
 * utils/formatters.js
 * Pure formatting helpers — no side effects, no imports.
 * Import only what you need; tree-shaking removes the rest.
 */

// ── Date / Time ────────────────────────────────────────────────────────────

/**
 * Format an ISO date string or Date object into a readable date.
 * @param {string|Date} date
 * @param {"short"|"medium"|"long"|"full"} [style="medium"]
 * @example formatDate("2024-03-15") → "Mar 15, 2024"
 */
export const formatDate = (date, style = "medium") => {
    if (!date) return "—";
    try {
        return new Intl.DateTimeFormat("en-US", { dateStyle: style }).format(
            new Date(date)
        );
    } catch {
        return String(date);
    }
};

/**
 * Format date + time.
 * @example formatDateTime("2024-03-15T14:30:00") → "Mar 15, 2024, 2:30 PM"
 */
export const formatDateTime = (date) => {
    if (!date) return "—";
    try {
        return new Intl.DateTimeFormat("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(date));
    } catch {
        return String(date);
    }
};

/**
 * Return a human-friendly relative time string.
 * @example timeAgo("2024-03-14T10:00:00") → "2 days ago"
 */
export const timeAgo = (date) => {
    if (!date) return "—";
    try {
        const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
        const diffMs = new Date(date) - Date.now();
        const diffSecs = Math.round(diffMs / 1000);
        const diffMins = Math.round(diffSecs / 60);
        const diffHrs = Math.round(diffMins / 60);
        const diffDays = Math.round(diffHrs / 24);
        const diffWks = Math.round(diffDays / 7);
        const diffMths = Math.round(diffDays / 30);
        const diffYrs = Math.round(diffDays / 365);

        if (Math.abs(diffSecs) < 60) return rtf.format(diffSecs, "second");
        if (Math.abs(diffMins) < 60) return rtf.format(diffMins, "minute");
        if (Math.abs(diffHrs) < 24) return rtf.format(diffHrs, "hour");
        if (Math.abs(diffDays) < 7) return rtf.format(diffDays, "day");
        if (Math.abs(diffWks) < 5) return rtf.format(diffWks, "week");
        if (Math.abs(diffMths) < 12) return rtf.format(diffMths, "month");
        return rtf.format(diffYrs, "year");
    } catch {
        return String(date);
    }
};

// ── Numbers & Currency ─────────────────────────────────────────────────────

/**
 * Format a number as currency.
 * @example formatCurrency(4820.5) → "$4,820.50"
 * @example formatCurrency(4820, "EUR", "de-DE") → "4.820,00 €"
 */
export const formatCurrency = (
    amount,
    currency = "USD",
    locale = "en-US"
) => {
    if (amount == null) return "—";
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(amount);
};

/**
 * Compact large numbers.
 * @example formatCompact(1_430_000) → "1.4M"
 */
export const formatCompact = (num) => {
    if (num == null) return "—";
    return new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(num);
};

/**
 * Format a plain number with thousand separators.
 * @example formatNumber(1234567) → "1,234,567"
 */
export const formatNumber = (num, decimals = 0) => {
    if (num == null) return "—";
    return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(num);
};

/**
 * Format a decimal as a percentage.
 * @example formatPercent(0.1234) → "12.34%"
 */
export const formatPercent = (value, decimals = 1) => {
    if (value == null) return "—";
    return `${(value * 100).toFixed(decimals)}%`;
};

// ── File sizes ─────────────────────────────────────────────────────────────

/**
 * Human-readable file size.
 * @example formatFileSize(1_572_864) → "1.5 MB"
 */
export const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return "—";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// ── Strings ────────────────────────────────────────────────────────────────

/** "hello world" → "Hello World" */
export const toTitleCase = (str = "") =>
    str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

/** Capitalise first letter only */
export const capitalize = (str = "") =>
    str.charAt(0).toUpperCase() + str.slice(1);

/** Truncate with ellipsis */
export const truncate = (str = "", maxLen = 80) =>
    str.length <= maxLen ? str : `${str.slice(0, maxLen).trimEnd()}…`;

/**
 * Mask sensitive strings (emails, phone numbers, etc.)
 * @example maskEmail("john@example.com") → "jo**@example.com"
 */
export const maskEmail = (email = "") => {
    const [local, domain] = email.split("@");
    if (!domain) return email;
    const visible = local.slice(0, 2);
    return `${visible}${"*".repeat(Math.max(2, local.length - 2))}@${domain}`;
};

/** Initials from a full name */
export const getInitials = (name = "") => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2)
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
};

/** Pluralise a word */
export const pluralize = (count, singular, plural) =>
    count === 1 ? `${count} ${singular}` : `${count} ${plural ?? singular + "s"}`;