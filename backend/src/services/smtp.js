/**
 * SMTP transport. The fallback provider — set MAIL_PROVIDER=smtp to use it
 * instead of the Gmail API, which is the default.
 */

const nodemailer = require("nodemailer");

let transporter = null;

/**
 * Build the SMTP transport from the environment, once. Returns null when the
 * integration is not configured, so callers can answer 503 rather than crash.
 */
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
      host,
      port,
      // 465 is implicit TLS; 587 upgrades with STARTTLS.
      secure: port === 465,
      auth: { user, pass },
    });
  }

  return transporter;
}

/** True when SMTP_HOST/USER/PASS are all present. */
function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/** Send one plain-text email. Throws on failure. */
async function sendViaSmtp({ to, subject, text }) {
  const transport = getTransporter();

  if (!transport) {
    const error = new Error("SMTP is not configured on the server");
    error.statusCode = 503;
    throw error;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const info = await transport.sendMail({ from, to, subject, text });

  return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected, from };
}

module.exports = { sendViaSmtp, isSmtpConfigured };
