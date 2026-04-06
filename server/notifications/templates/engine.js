/**
 * notifications/templates/engine.js
 * Basic template engine using JS literal strings.
 */

const baseLayout = (content) => `
  <div style="font-family: sans-serif; max-width: 560px; margin: auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
    ${content}
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
    <p style="color: #9ca3af; font-size: 13px;">
      If you did not request this, please ignore this email.
    </p>
  </div>
`;

const renderVerificationEmail = ({ name, verificationLink, otp }) => {
  const content = `
    <h2 style="margin: 0 0 16px; color: #111827;">Verify Your Email Address</h2>
    <p style="color: #6b7280; line-height: 1.6;">
      Hi ${name},<br/><br/>
      Thank you for registering! Please verify your email address to get access to all features.
      Choose one of the methods below. This link and OTP will expire in <strong>24 hours</strong>.
    </p>
    
    <div style="margin: 24px 0;">
      <p style="color: #6b7280; line-height: 1.6; margin-bottom: 8px;"><strong>Method 1: Click the Link</strong></p>
      <a href="${verificationLink}"
         style="display: inline-block; padding: 12px 28px; background: #4f46e5;
                color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600;">
        Verify Email Address
      </a>
    </div>

    <div style="margin: 24px 0;">
      <p style="color: #6b7280; line-height: 1.6; margin-bottom: 8px;"><strong>Method 2: Use the OTP Code</strong></p>
      <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #111827; background: #e5e7eb; padding: 12px; border-radius: 8px; display: inline-block;">
        ${otp}
      </div>
    </div>
  `;
  return baseLayout(content);
};

module.exports = {
  renderVerificationEmail,
};
