/**
 * utils/logger.js
 * Winston-powered logger.
 * - Development: coloured, human-readable console output
 * - Production:  structured JSON to stdout (easily shipped to Datadog / CloudWatch)
 */

const { createLogger, format, transports } = require("winston");
const env = require("../config/env");

const { combine, timestamp, printf, colorize, errors, json } = format;

// ── Development formatter ──────────────────────────────────────────────────
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack }) => {
    return stack
      ? `[${ts}] ${level}: ${message}\n${stack}`
      : `[${ts}] ${level}: ${message}`;
  })
);

// ── Production formatter ───────────────────────────────────────────────────
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const logger = createLogger({
  level: env.isDev ? "debug" : "info",
  format: env.isDev ? devFormat : prodFormat,
  transports: [new transports.Console()],
  // Prevent logger itself from throwing on unhandled rejections
  exitOnError: false,
});

module.exports = logger;