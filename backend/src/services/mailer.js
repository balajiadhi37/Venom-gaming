/**
 * SMTP email for the admin panel.
 *
 * Unlike services/whatsapp.js this one DOES report failure to the caller: the
 * admin pressed a button and is waiting to learn whether the mail went out, so
 * a silent failure would be a lie. The route awaits it and surfaces the error.
 */

const nodemailer = require("nodemailer");

const SUBJECT_MAX = 150;
const BODY_MAX = 5000;

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
function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/**
 * Send one plain-text email. Throws on failure so the caller can report it —
 * the admin needs to know the mail did not go out.
 */
async function sendMail({ to, subject, text }) {
  const transport = getTransporter();

  if (!transport) {
    const error = new Error("Email is not configured on the server");
    error.statusCode = 503;
    throw error;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  const info = await transport.sendMail({ from, to, subject, text });

  return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected };
}

module.exports = { sendMail, isMailConfigured, SUBJECT_MAX, BODY_MAX };
