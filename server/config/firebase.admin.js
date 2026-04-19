/**
 * config/firebase.admin.js
 * Firebase Admin SDK — server-side token verification.
 *
 * Supports two credential strategies (in order of preference):
 *  1. FIREBASE_SERVICE_ACCOUNT_JSON env var  (JSON string — ideal for containers)
 *  2. GOOGLE_APPLICATION_CREDENTIALS env var (path to service account file)
 *
 * Prevents duplicate initialisation across require() calls.
 */

const admin  = require("firebase-admin");
const logger = require("../utils/logger");

if (!admin.apps.length) {
  try {
    let credential;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // Strategy 1: JSON string in env var (Docker / Railway / Render friendly)
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      credential = admin.credential.cert(serviceAccount);
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Strategy 2: Path to .json file on disk
      credential = admin.credential.applicationDefault();
    } else {
      throw new Error(
        "Firebase Admin credentials not found. " +
        "Set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS."
      );
    }

    admin.initializeApp({ credential });
    logger.info("[Firebase Admin] Initialised successfully.");
  } catch (err) {
    logger.error("[Firebase Admin] Initialisation failed:", err.message);
    // Crash the process — app cannot function without auth capability
    process.exit(1);
  }
}

module.exports = admin;
