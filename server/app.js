/**
 * app.js
 * Express application factory.
 * Keeps HTTP config separate from the server entry point (server.js)
 * so the app can be imported in integration tests without starting a real server.
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
// express-mongo-sanitize can attempt to assign to `req.query` which
// may be getter-only in newer Node/Express builds. Use a lightweight
// sanitizer that only mutates `req.body` and `req.params` to avoid
// "Cannot set property query of #<IncomingMessage>" errors.
const cookieParser = require("cookie-parser");

const env = require("./config/env");
const logger = require("./utils/logger");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const uploadRoutes = require("./routes/upload.routes");
const errorMiddleware = require("./middleware/error.middleware");
const AppError = require("./utils/AppError");
const { HTTP_STATUS } = require("./constants");

const app = express();

// ── Security headers ───────────────────────────────────────────────────────
// Configure helmet to allow Firebase popup authentication
// COOP must be 'unsafe-none' or not set for cross-origin popups to work
app.use(helmet({
  crossOriginOpenerPolicy: false, // Disable COOP to allow Firebase popup
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// ── CORS ───────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true, // Allow cookies to be sent cross-origin
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Rate limiting ──────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // Default: 15 min
  max: env.RATE_LIMIT_MAX,            // Default: 100 req / window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});
app.use("/api", limiter);

// Stricter limiter for auth routes to prevent brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: { success: false, message: "Too many auth attempts. Please try again in 15 minutes." },
});
app.use("/api/v1/auth/login", authLimiter);
app.use("/api/v1/auth/register", authLimiter);

// ── Request parsing ────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));        // Protect against large payloads
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// ── Data sanitisation (prevents NoSQL injection) ──────────────────────────
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") return;
  Object.keys(obj).forEach((key) => {
    // Remove MongoDB operator keys and dotted paths
    if (key.startsWith("$") || key.indexOf(".") !== -1) {
      delete obj[key];
    } else {
      sanitizeObject(obj[key]);
    }
  });
};

app.use((req, _res, next) => {
  sanitizeObject(req.body);
  sanitizeObject(req.params);
  // Do NOT assign to req.query to avoid read-only setter issues
  next();
});

// ── HTTP request logging ───────────────────────────────────────────────────
if (env.isDev) {
  app.use(morgan("dev"));
} else {
  // In production, pipe morgan into winston
  app.use(
    morgan("combined", {
      stream: { write: (msg) => logger.info(msg.trim()) },
    })
  );
}

// ── Health check ───────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Server is healthy.",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ── API routes ─────────────────────────────────────────────────────────────
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/upload", uploadRoutes);

// ── Feature flags stub (returns empty flags) ─────────────────────────────
app.get("/api/v1/feature-flags", (_req, res) => {
  res.json({ success: true, data: { flags: {} } });
});

// ── 404 handler (must come after all routes) ──────────────────────────────
app.use((req, _res, next) => {
  next(
    new AppError(
      `Route not found: ${req.method} ${req.originalUrl}`,
      HTTP_STATUS.NOT_FOUND
    )
  );
});

// ── Global error handler (must be last) ───────────────────────────────────
app.use(errorMiddleware);

module.exports = app;