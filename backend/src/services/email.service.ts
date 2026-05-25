import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import { logger } from '../utils/logger';

/**
 * Email service for Aus Auto Parts Platform
 * Handles transactional emails: verification, password reset, order confirmations
 *
 * Config via environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM
 *
 * Falls back to console-log mode when SMTP_HOST is not configured (dev/test).
 */

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Singleton transporter — created once, reused
let transporter: Transporter | null = null;

const isConfigured = (): boolean => {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
};

const getTransporter = (): Transporter => {
  if (transporter) return transporter;

  if (!isConfigured()) {
    // Dev/test mode: log to console instead of sending
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    logger.info('[email] SMTP not configured — running in console-log mode');
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  logger.info('[email] SMTP transporter initialised', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
  });

  return transporter;
};

/**
 * Core send function — all other email functions go through this
 */
export const sendEmail = async (payload: EmailPayload): Promise<void> => {
  const from = process.env.EMAIL_FROM || 'noreply@aus-auto-parts.com';

  const mailOptions: SendMailOptions = {
    from,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text || stripHtml(payload.html),
  };

  try {
    const transport = getTransporter();

    if (!isConfigured()) {
      // Dev mode: log the email instead of sending
      logger.info('[email] DEV MODE — email not sent, logging instead', {
        to: payload.to,
        subject: payload.subject,
        preview: payload.text?.substring(0, 200) || stripHtml(payload.html).substring(0, 200),
      });
      return;
    }

    const result = await transport.sendMail(mailOptions);
    logger.info('[email] Email sent', {
      to: payload.to,
      subject: payload.subject,
      messageId: result.messageId,
    });
  } catch (err) {
    logger.error('[email] Failed to send email', {
      to: payload.to,
      subject: payload.subject,
      error: (err as Error).message,
    });
    // Do NOT throw — email failures should never break the primary request
    // The caller already has the token; user can request a resend
  }
};

// ─── Transactional Email Templates ────────────────────────────────────────────

/**
 * Send email verification link to new user
 */
export const sendVerificationEmail = async (
  to: string,
  token: string,
  userName?: string
): Promise<void> => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;
  const name = userName || 'there';

  await sendEmail({
    to,
    subject: 'Verify your Aus Auto Parts account',
    html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: #1a1a2e; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: #e94560; margin: 0;">Aus Auto Parts</h1>
    <p style="color: #aaa; margin: 4px 0 0;">Multi-Tenant Parts Platform</p>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #eee;">
    <h2>Hi ${name},</h2>
    <p>Thanks for registering. Please verify your email address to activate your account.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verifyUrl}"
         style="background: #e94560; color: white; padding: 14px 28px; border-radius: 6px;
                text-decoration: none; font-weight: bold; display: inline-block;">
        Verify Email Address
      </a>
    </div>
    <p style="color: #888; font-size: 13px;">
      This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
    </p>
    <p style="color: #bbb; font-size: 12px; margin-top: 20px;">
      Or copy this link: <a href="${verifyUrl}" style="color: #e94560;">${verifyUrl}</a>
    </p>
  </div>
</body>
</html>
    `.trim(),
    text: `Hi ${name},\n\nVerify your Aus Auto Parts account:\n${verifyUrl}\n\nThis link expires in 24 hours.`,
  });
};

/**
 * Send password reset link
 */
export const sendPasswordResetEmail = async (
  to: string,
  token: string,
  userName?: string
): Promise<void> => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  const name = userName || 'there';

  await sendEmail({
    to,
    subject: 'Reset your Aus Auto Parts password',
    html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: #1a1a2e; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: #e94560; margin: 0;">Aus Auto Parts</h1>
    <p style="color: #aaa; margin: 4px 0 0;">Password Reset</p>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #eee;">
    <h2>Hi ${name},</h2>
    <p>We received a request to reset your password. Click the button below to create a new password.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}"
         style="background: #e94560; color: white; padding: 14px 28px; border-radius: 6px;
                text-decoration: none; font-weight: bold; display: inline-block;">
        Reset Password
      </a>
    </div>
    <p style="color: #888; font-size: 13px;">
      This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
      Your password will not change.
    </p>
    <p style="color: #bbb; font-size: 12px; margin-top: 20px;">
      Or copy this link: <a href="${resetUrl}" style="color: #e94560;">${resetUrl}</a>
    </p>
  </div>
</body>
</html>
    `.trim(),
    text: `Hi ${name},\n\nReset your Aus Auto Parts password:\n${resetUrl}\n\nThis link expires in 1 hour.`,
  });
};

/**
 * Send order confirmation to customer
 */
export const sendOrderConfirmationEmail = async (
  to: string,
  orderNumber: string,
  customerName: string,
  totalAmount: number,
  currency: string = 'AUD'
): Promise<void> => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const orderUrl = `${baseUrl}/orders/${orderNumber}`;
  const formattedAmount = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
  }).format(totalAmount);

  await sendEmail({
    to,
    subject: `Order Confirmed — ${orderNumber}`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: #1a1a2e; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: #e94560; margin: 0;">Aus Auto Parts</h1>
    <p style="color: #aaa; margin: 4px 0 0;">Order Confirmation</p>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #eee;">
    <h2>Hi ${customerName},</h2>
    <p>Your order has been confirmed!</p>
    <div style="background: white; border: 1px solid #ddd; border-radius: 6px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Order Number</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${orderNumber}</td>
        </tr>
        <tr style="border-top: 1px solid #eee;">
          <td style="padding: 8px 0; color: #666;">Total Amount</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #e94560;">${formattedAmount}</td>
        </tr>
      </table>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${orderUrl}"
         style="background: #e94560; color: white; padding: 14px 28px; border-radius: 6px;
                text-decoration: none; font-weight: bold; display: inline-block;">
        View Order
      </a>
    </div>
    <p style="color: #888; font-size: 13px;">
      Thank you for your business. If you have any questions, please contact us.
    </p>
  </div>
</body>
</html>
    `.trim(),
    text: `Hi ${customerName},\n\nYour order ${orderNumber} has been confirmed.\nTotal: ${formattedAmount}\n\nView your order: ${orderUrl}`,
  });
};

// ─── Utility ───────────────────────────────────────────────────────────────────

const stripHtml = (html: string): string => {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export default {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
};
