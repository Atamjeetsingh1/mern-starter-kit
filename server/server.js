/**
 * server.js
 * Application entry point.
 * Loads env vars, connects to DB, then starts the HTTP server.
 */

// Load .env FIRST — before any other module reads process.env
require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const env = require("./config/env");
const logger = require("./utils/logger");

const startServer = async () => {
  // Connect to MongoDB before accepting traffic
  await connectDB();

  const server = app.listen(env.PORT, () => {
    logger.info(
      `Server running in ${env.NODE_ENV} mode on port ${env.PORT}`
    );
  });

  // ── Graceful shutdown ──────────────────────────────────────────────────
  const shutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      logger.info("HTTP server closed.");
      process.exit(0);
    });

    // Force-kill if server hasn't closed within 10 s
    setTimeout(() => {
      logger.error("Forced shutdown after 10 s timeout.");
      process.exit(1);
    }, 10_000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // ── Unhandled rejection safety net ────────────────────────────────────
  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled Promise Rejection:", reason);
    shutdown("unhandledRejection");
  });

  process.on("uncaughtException", (err) => {
    logger.error("Uncaught Exception:", err);
    process.exit(1); // Uncaught = unknown state → restart immediately
  });
};

startServer();