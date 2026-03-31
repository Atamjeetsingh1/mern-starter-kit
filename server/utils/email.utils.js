/**
 * utils/email.utils.js
 * Nodemailer email helper.
 * Configure SMTP in .env — works with Gmail, Resend, SendGrid, Mailgun, etc.
 */

const nodemailer = require("nodemailer");
const logger = require("./logger");

/**
 * Create a reusable transporter.
 * For development use Ethereal (https://ethereal.email) — a fake SMTP service.
 * In production set SMTP_* env vars to your real provider.
 */
const createTransporter = () => {
  if (process.env.NODE_ENV === "development" || !process.env.SMTP_HOST) {
    // Return a test transporter — emails won't actually be sent;
    // preview links are logged to the console.
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: process.env.SMTP_USER || "ethereal-user",
        pass: process.env.SMTP_PASS || "ethereal-pass",
      },
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send an email.
 * @param {{ to: string, subject: string, html: string, text?: string }} options
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();

  const info = await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || "MERN App"}" <${process.env.EMAIL_FROM || "no-reply@example.com"}>`,
    to,
    subject,
    text: text || subject,
    html,
  });

  logger.info(`Email sent to ${to} — Message ID: ${info.messageId}`);

  // In dev, log the Ethereal preview URL
  if (process.env.NODE_ENV !== "production") {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) logger.info(`Email preview: ${previewUrl}`);
  }

  return info;
};

// ── Reusable email templates ───────────────────────────────────────────────

/**
 * Send password-reset email with a tokenised link.
 * @param {string} to          Recipient email
 * @param {string} resetLink   Full URL: https://yourapp.com/reset-password?token=xxx
 */
const sendPasswordResetEmail = async (to, resetLink) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
      <h2 style="margin: 0 0 16px; color: #111827;">Reset your password</h2>
      <p style="color: #6b7280; line-height: 1.6;">
        You requested a password reset. Click the button below to choose a new password.
        This link expires in <strong>15 minutes</strong>.
      </p>
      <a href="${resetLink}"
         style="display: inline-block; margin: 24px 0; padding: 12px 28px; background: #4f46e5;
                color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600;">
        Reset password
      </a>
      <p style="color: #9ca3af; font-size: 13px;">
        If you didn't request this, you can safely ignore this email.
        Your password won't change until you click the link above.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #d1d5db; font-size: 12px;">
        Can't click the button? Copy this link:<br/>
        <a href="${resetLink}" style="color: #6b7280;">${resetLink}</a>
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject: "Reset your password",
    html,
  });
};

module.exports = { sendEmail, sendPasswordResetEmail };