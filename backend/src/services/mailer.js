/**
 * Mail dispatcher. Picks the transport from the MAIL_PROVIDER flag and hands
 * the send to it, so callers never care which one is in use.
 *
 * Unlike services/whatsapp.js this path DOES report failure to the caller: the
 * admin pressed a button and is waiting to learn whether the mail went out, so
 * a silent failure would be a lie.
 */

const gmail = require("./gmail");
const smtp = require("./smtp");

const SUBJECT_MAX = 150;
const BODY_MAX = 5000;

const PROVIDERS = ["gmail", "smtp"];
const DEFAULT_PROVIDER = "gmail";

/**
 * The configured provider. Anything unrecognised falls back to the default
 * rather than failing at boot — a typo in .env should not stop the arena
 * taking bookings, and the admin panel surfaces which provider is live.
 */
function getProvider() {
  const raw = String(process.env.MAIL_PROVIDER || DEFAULT_PROVIDER).trim().toLowerCase();
  return PROVIDERS.includes(raw) ? raw : DEFAULT_PROVIDER;
}

/**
 * What the admin panel shows: which provider is active, whether the server
 * credentials exist, and — for Gmail — which account is connected.
 */
async function getMailStatus() {
  const provider = getProvider();

  if (provider === "smtp") {
    return {
      provider,
      configured: smtp.isSmtpConfigured(),
      connected: smtp.isSmtpConfigured(),
      account: smtp.isSmtpConfigured() ? process.env.SMTP_FROM || process.env.SMTP_USER : null,
      canConnect: false,
    };
  }

  const configured = gmail.isGmailConfigured();
  const account = configured ? await gmail.getConnectedAccount() : null;

  return {
    provider,
    configured,
    connected: Boolean(account),
    account: account?.email || null,
    connectedAt: account?.connectedAt || null,
    // Only Gmail has an interactive connect step for the admin to run.
    canConnect: configured,
  };
}

/** True when the active provider is ready to send right now. */
async function isMailReady() {
  const status = await getMailStatus();
  return status.configured && status.connected;
}

/** Send one plain-text email through the active provider. Throws on failure. */
async function sendMail({ to, subject, text }) {
  return getProvider() === "smtp"
    ? smtp.sendViaSmtp({ to, subject, text })
    : gmail.sendViaGmail({ to, subject, text });
}

module.exports = {
  sendMail,
  getProvider,
  getMailStatus,
  isMailReady,
  PROVIDERS,
  DEFAULT_PROVIDER,
  SUBJECT_MAX,
  BODY_MAX,
};
