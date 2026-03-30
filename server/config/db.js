/**
 * config/db.js
 * Mongoose connection with graceful error handling and retry logic.
 */

const mongoose = require("mongoose");
const env = require("./env");
const logger = require("../utils/logger");

/**
 * Connect to MongoDB.
 * Exits the process if the initial connection fails so that
 * the process manager (PM2, Docker restart policy, etc.) can restart it.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      // These are the recommended options for Mongoose 7+
      serverSelectionTimeoutMS: 5000, // Fail fast on first connect
    });

    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1); // Exit — let the process manager restart
  }
};

// ── Mongoose global event listeners ──────────────────────────────────────────

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected. Attempting to reconnect...");
});

mongoose.connection.on("reconnected", () => {
  logger.info("MongoDB reconnected.");
});

// Graceful shutdown: close DB when app terminates
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  logger.info("MongoDB connection closed (SIGINT).");
  process.exit(0);
});

module.exports = connectDB;