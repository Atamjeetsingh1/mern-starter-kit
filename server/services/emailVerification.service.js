/**
 * services/emailVerification.service.js
 * Business logic for the email verification flow.
 */

const crypto = require("crypto");
const User = require("../models/User");
const { sendVerificationEmail } = require("../notifications/services/email.services");
const AppError = require("../utils/AppError");
const { HTTP_STATUS } = require("../constants");
const env = require("../config/env");

const VERIFICATION_EXPIRES_HOURS = 24;

// Helper: Hash sensitive tokens/OTPs before storing
const hashData = (plain) => crypto.createHash("sha256").update(plain).digest("hex");

// Helper: Generate a random 6-digit numeric OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * Generate tokens (hex link + 6-digit OTP) and send verification email.
 * This can be called during user registration or when "resend verification" is triggered.
 * 
 * @param {Object} user - The Mongoose User document
 */
const generateAndSendVerification = async (user) => {
  // 1. Generate tokens
  const plainToken = crypto.randomBytes(32).toString("hex");
  const plainOTP = generateOTP();

  // 2. Hash and store tokens with expiry
  user.emailVerificationToken = hashData(plainToken);
  user.emailVerificationOTP = hashData(plainOTP);
  user.emailVerificationExpire = new Date(Date.now() + VERIFICATION_EXPIRES_HOURS * 60 * 60 * 1000);
  
  // We use validateBeforeSave: false in case other required fields aren't populated here
  await user.save({ validateBeforeSave: false });

  // 3. Build verification link
  // Expected client URL format. Adjust based on your frontend routing.
  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
  const verificationLink = `${clientUrl}/verify-email?token=${plainToken}`;

  try {
    // 4. Send Email
    await sendVerificationEmail(user.email, user.name, verificationLink, plainOTP);
  } catch (error) {
    // 5. If email fails, wipe the token fields to allow retry
    user.emailVerificationToken = undefined;
    user.emailVerificationOTP = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    // Optional: We might not want to throw an error if called during registration,
    // so we can just log it or throw depending on how strict you want to be.
    throw new AppError(
      "Failed to send the verification email. Please try again later.",
      HTTP_STATUS.INTERNAL_ERROR
    );
  }
};

/**
 * Verify user via the token (clicked from email link)
 * @param {string} plainToken 
 */
const verifyByToken = async (plainToken) => {
  const hashedToken = hashData(plainToken);

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpire: { $gt: Date.now() },
  }).select("+emailVerificationToken +emailVerificationExpire +emailVerificationOTP");

  if (!user) {
    throw new AppError(
      "Verification link is invalid or has expired.",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationOTP = undefined;
  user.emailVerificationExpire = undefined;

  await user.save({ validateBeforeSave: false });
  return user;
};

/**
 * Verify user via the 6-digit OTP
 * @param {string} userId - ID of the currently authenticated user
 * @param {string} plainOTP 
 */
const verifyByOTP = async (userId, plainOTP) => {
  const hashedOTP = hashData(plainOTP);

  const user = await User.findOne({
    _id: userId,
    emailVerificationOTP: hashedOTP,
    emailVerificationExpire: { $gt: Date.now() },
  }).select("+emailVerificationToken +emailVerificationExpire +emailVerificationOTP");

  if (!user) {
    throw new AppError(
      "OTP is invalid or has expired.",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationOTP = undefined;
  user.emailVerificationExpire = undefined;

  await user.save({ validateBeforeSave: false });
  return user;
};

/**
 * Resend verification email
 * @param {string} email 
 */
const resendVerification = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Silent fail to prevent email enumeration
    return;
  }

  if (user.isEmailVerified) {
    throw new AppError("Email is already verified.", HTTP_STATUS.BAD_REQUEST);
  }

  await generateAndSendVerification(user);
};

module.exports = {
  generateAndSendVerification,
  verifyByToken,
  verifyByOTP,
  resendVerification,
};
