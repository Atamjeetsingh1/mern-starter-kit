const admin = require('firebase-admin');
const logger = require('../../utils/logger');

/**
 * firebase.provider.js
 *
 * Thin wrapper around Firebase Admin SDK.
 * All Firebase-specific logic is isolated here — swap provider without
 * touching notification.service.js.
 *
 * Setup:
 *   1. Go to Firebase Console → Project Settings → Service Accounts
 *   2. Generate new private key → download JSON
 *   3. Set FIREBASE_SERVICE_ACCOUNT env var to the JSON string
 *      OR set FIREBASE_SERVICE_ACCOUNT_PATH to the file path
 */

let _initialized = false;

function initializeFirebase() {
  if (_initialized || admin.apps.length > 0) return;

  let credential;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Production: JSON string in env var (recommended for cloud deployments)
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      credential = admin.credential.cert(serviceAccount);
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not valid JSON');
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    // Local dev: path to service account file
    credential = admin.credential.cert(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
  } else {
    throw new Error(
      'Firebase not configured. Set FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_PATH'
    );
  }

  admin.initializeApp({ credential });
  _initialized = true;
  logger.info('Firebase Admin SDK initialized');
}

// Initialize on module load
initializeFirebase();

// ─── Send Functions ──────────────────────────────────────────────────────────

/**
 * Send push notification to a single FCM token.
 *
 * @param {string} token - FCM device token
 * @param {{ title: string, body: string }} notification
 * @param {object} data - Custom data payload (string values only per FCM spec)
 * @returns {Promise<{ success: boolean, messageId?: string, error?: object }>}
 */
async function sendToToken(token, { title, body }, data = {}) {
  try {
    // FCM data payload values must be strings
    const stringifiedData = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    );

    const message = {
      token,
      notification: { title, body },
      data: stringifiedData,
      android: {
        priority: 'high',
        notification: { sound: 'default' },
      },
      apns: {
        payload: {
          aps: { sound: 'default', badge: 1 },
        },
      },
      webpush: {
        notification: { icon: '/icons/notification-icon.png' },
      },
    };

    const messageId = await admin.messaging().send(message);
    return { success: true, messageId };
  } catch (error) {
    logger.error('FCM send failed', { token: token.slice(0, 20) + '...', error: error.message });
    return { success: false, error: { code: error.code, message: error.message } };
  }
}

/**
 * Send to multiple tokens using FCM batch send.
 * Returns per-token results — caller handles partial failures.
 *
 * @param {string[]} tokens
 * @param {{ title: string, body: string }} notification
 * @param {object} data
 * @returns {Promise<Array<{ token, success, messageId?, error? }>>}
 */
async function sendToMultipleTokens(tokens, notification, data = {}) {
  if (!tokens.length) return [];

  // FCM sendEachForMulticast supports up to 500 tokens per batch
  const BATCH_SIZE = 500;
  const results = [];

  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens.slice(i, i + BATCH_SIZE);

    const stringifiedData = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    );

    const multicastMessage = {
      tokens: batch,
      notification,
      data: stringifiedData,
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    };

    const response = await admin.messaging().sendEachForMulticast(multicastMessage);

    response.responses.forEach((res, index) => {
      results.push({
        token: batch[index],
        success: res.success,
        messageId: res.messageId ?? null,
        error: res.error ? { code: res.error.code, message: res.error.message } : null,
      });
    });
  }

  return results;
}

/**
 * Validate whether a token is still registered with FCM.
 * Sends a dry-run message — no actual notification delivered.
 *
 * @param {string} token
 * @returns {Promise<boolean>}
 */
async function isTokenValid(token) {
  try {
    await admin.messaging().send({ token, condition: "'dummy' in topics" }, true); // dryRun
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if an FCM error code means the token is permanently invalid.
 * Use this to deactivate stale tokens in DeviceToken collection.
 */
function isTokenInvalidError(errorCode) {
  return [
    'messaging/invalid-registration-token',
    'messaging/registration-token-not-registered',
    'messaging/invalid-argument',
  ].includes(errorCode);
}

module.exports = {
  sendToToken,
  sendToMultipleTokens,
  isTokenValid,
  isTokenInvalidError,
};
