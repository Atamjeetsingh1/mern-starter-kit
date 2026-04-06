/**
 * notifications/services/email.services.js
 * High-level email business operations relying on the base email utility.
 */

const { sendEmail } = require("../../utils/email.utils");
const { renderVerificationEmail } = require("../templates/engine");

/**
 * Dispatches an email containing the verification link and OTP.
 * @param {string} email - The user's email address
 * @param {string} name - The user's name
 * @param {string} verificationLink - The full URL for email verification
 * @param {string} otp - The 6-digit plain OTP code
 */
const sendVerificationEmail = async (email, name, verificationLink, otp) => {
  const html = renderVerificationEmail({ name, verificationLink, otp });
  
  return sendEmail({
    to: email,
    subject: "Verify Your Email Address",
    html,
  });
};

module.exports = {
  sendVerificationEmail,
};
