/**
 * sockets/socketAuth.js
 * Socket.IO middleware — verifies the JWT from the handshake
 * and attaches { userId, role } to socket.data.
 *
 * Usage: io.use(socketAuth)
 */

const { verifyAccessToken } = require("../utils/token.utils");
const logger = require("../utils/logger");

const socketAuth = (socket, next) => {
  try {
    // Token is sent in socket.handshake.auth.token (set client-side)
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication error: No token provided."));
    }

    const decoded = verifyAccessToken(token);
    // Attach to socket.data — accessible in all event handlers
    socket.data.userId = String(decoded.id);
    socket.data.role = decoded.role;

    next();
  } catch (err) {
    logger.warn(`Socket auth failed: ${err.message}`);
    next(new Error("Authentication error: Invalid or expired token."));
  }
};

module.exports = socketAuth;
