/**
 * server.js
 * Application entry point.
 * Loads env vars, connects to DB, then starts the HTTP + WebSocket server.
 *
 * Socket.IO shares the same port as Express by wrapping the Express app
 * in a native http.Server — the standard Socket.IO pattern.
 */

// Load .env FIRST — before any other module reads process.env
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/db");
const env = require("./config/env");
const logger = require("./utils/logger");
const socketAuth = require("./sockets/socketAuth");
const { getSocketManager } = require("./sockets/socketManager");

const startServer = async () => {
  // Connect to MongoDB before accepting traffic
  await connectDB();

  // ── HTTP Server (wraps Express) ───────────────────────────────────────────
  const httpServer = http.createServer(app);

  // ── Socket.IO ───────────────────────────────────────────────────────────
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Reconnection is handled client-side; server sets generous ping timeouts
    pingTimeout: 60_000,
    pingInterval: 25_000,
    // Transports: try WebSocket first, fall back to polling
    transports: ["websocket", "polling"],
  });

  // Apply JWT authentication middleware to all socket connections
  io.use(socketAuth);

  // Register all socket event handlers
  getSocketManager(io);

  // ── Start listening ───────────────────────────────────────────────────────
  httpServer.listen(env.PORT, () => {
    logger.info(
      `Server running in ${env.NODE_ENV} mode on port ${env.PORT} (HTTP + WebSocket)`
    );
  });

  // ── Graceful shutdown ───────────────────────────────────────────────────────
  const shutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    io.close(); // Disconnect all sockets cleanly
    httpServer.close(() => {
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

  // ── Unhandled rejection safety net ─────────────────────────────────────────
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