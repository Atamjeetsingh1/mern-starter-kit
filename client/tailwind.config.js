/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      // ── Custom animations ────────────────────────────────────────────
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInScale: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-100%)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(100%)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in": "fadeIn 200ms ease-out",
        "fade-in-scale": "fadeInScale 150ms ease-out",
        "slide-in-right": "slideInRight 200ms ease-out",
        "slide-in-left": "slideInLeft 250ms ease-out",
        "slide-in": "slideIn 250ms ease-out",
        "slide-up": "slideUp 200ms ease-out",
        shimmer: "shimmer 1.5s infinite linear",
      },

      // ── Brand colour palette ─────────────────────────────────────────
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",   // primary action
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
      },

      // ── Box shadows ──────────────────────────────────────────────────
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)",
        "card-hover": "0 4px 12px 0 rgb(0 0 0 / 0.10)",
        modal: "0 20px 60px -15px rgb(0 0 0 / 0.30)",
        sidebar: "1px 0 0 0 rgb(0 0 0 / 0.06)",
      },

      // ── Font family ──────────────────────────────────────────────────
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },

      // ── Screen breakpoints ───────────────────────────────────────────
      screens: {
        xs: "480px",
      },
    },
  },

  plugins: [],

  // Enable dark mode via class strategy (toggle by adding "dark" to <html>)
  darkMode: "class",
};