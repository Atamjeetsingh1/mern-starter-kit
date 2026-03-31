/**
 * components/layout/Footer.jsx
 * Two variants:
 *   - <Footer />          App footer (inside authenticated layout)
 *   - <PublicFooter />    Marketing / landing page footer
 */

import React from "react";
import { Link } from "react-router-dom";

// ── App Footer (inside dashboard) ─────────────────────────────────────────
const Footer = ({ className = "" }) => (
  <footer className={`border-t border-gray-100 py-4 px-6 ${className}`}>
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
      <p>© {new Date().getFullYear()} MERN Boilerplate. All rights reserved.</p>
      <div className="flex items-center gap-4">
        <Link to="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
        <Link to="/terms"   className="hover:text-gray-600 transition-colors">Terms</Link>
        <a
          href="mailto:support@example.com"
          className="hover:text-gray-600 transition-colors"
        >
          Support
        </a>
      </div>
    </div>
  </footer>
);

// ── Public / Marketing Footer ──────────────────────────────────────────────
const NAV_COLS = [
  {
    heading: "Product",
    links: [
      { label: "Features",  href: "#features" },
      { label: "Pricing",   href: "#pricing" },
      { label: "Changelog", href: "/changelog" },
      { label: "Roadmap",   href: "/roadmap" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About",   href: "/about" },
      { label: "Blog",    href: "/blog" },
      { label: "Careers", href: "/careers" },
      { label: "Press",   href: "/press" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy",  href: "/privacy" },
      { label: "Terms of Service",href: "/terms" },
      { label: "Cookie Policy",   href: "/cookies" },
    ],
  },
];

export const PublicFooter = () => (
  <footer className="bg-gray-900 text-gray-400">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      {/* Top: brand + nav cols */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-white font-bold">MERN App</span>
          </Link>
          <p className="text-sm leading-relaxed">
            A production-ready MERN stack boilerplate for building modern web applications faster.
          </p>
        </div>

        {/* Nav columns */}
        {NAV_COLS.map((col) => (
          <div key={col.heading}>
            <p className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">
              {col.heading}
            </p>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom: copyright */}
      <div className="mt-12 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <p>© {new Date().getFullYear()} MERN Boilerplate, Inc. All rights reserved.</p>
        <div className="flex gap-5">
          {/* Social icons (placeholder) */}
          {["Twitter", "GitHub", "LinkedIn"].map((s) => (
            <a
              key={s}
              href="#"
              aria-label={s}
              className="hover:text-white transition-colors text-xs"
            >
              {s}
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;