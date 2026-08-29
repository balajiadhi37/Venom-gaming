/**
 * Gmail API transport.
 *
 * The admin connects their Google account once through the panel; mail is then
 * sent as that account. Uses plain fetch against Google's REST endpoints rather
 * than the googleapis SDK — the SDK is large and we need four calls.
 *
 * nodemailer is reused only to compose the MIME message, which the Gmail API
 * wants as a base64url blob. Hand-rolling MIME breaks on non-ASCII subjects.
 */

const MailComposer = require("nodemailer/lib/mail-composer");

const MailAccount = require("../models/MailAccount");
const { encrypt, decrypt } = require("./tokenCrypto");

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

// Endpoints are read at call time, not module load, so GOOGLE_TEST_BASE can
// point the whole exchange at a local stub. Unset in production, where these
// resolve to Google's real hosts.
let warnedTestBase = false;

const testBase = () => {
  const base = (process.env.GOOGLE_TEST_BASE || "").replace(/\/+$/, "");

  // This silently redirects every token exchange and send away from Google, so
  // it must never be a quiet setting. Shout once if it is on.
  if (base && !warnedTestBase) {
    warnedTestBase = true;
    console.warn(
      `WARNING: GOOGLE_TEST_BASE is set to ${base}. Gmail traffic is going to that stub, ` +
        "NOT to Google. Unset it in .env for real sending."
    );
  }

  return base;
};
const tokenUrl = () => (testBase() ? `${testBase()}/token` : "https://oauth2.googleapis.com/token");
const userinfoUrl = () =>
  testBase() ? `${testBase()}/userinfo` : "https://www.googleapis.com/oauth2/v2/userinfo";
const sendUrl = () =>
  testBase()
    ? `${testBase()}/gmail/send`
    : "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

// gmail.send is the narrowest scope that can send; userinfo.email only tells us
// which address was connected, so the panel can display it. Deliberately NOT
// gmail.readonly — nothing here should be able to read the arena's inbox.
const SCOPES = ["https://www.googleapis.com/auth/gmail.send", "https://www.googleapis.com/auth/userinfo.email"];

const REQUEST_TIMEOUT_MS = 10000;

// Access tokens live an hour; cache in memory so a burst of sends does not
// re-mint one every time. Lost on restart, which is harmless.
let cachedAccessToken = null;
let cachedAccessExpiry = 0;

// Pending OAuth `state` values. In memory because the flow completes in
// seconds; a restart mid-flow just means the admin clicks Connect again.
const pendingStates = new Map();
const STATE_TTL_MS = 10 * 60 * 1000;

function readConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/mail/gmail/callback",
  };
}

/** True when the Google OAuth client credentials are present. */
function isGmailConfigured() {
  return Boolean(readConfig());
}

function configOrThrow() {
  const config = readConfig();

  if (!config) {
    const error = new Error(
      "Gmail is not configured on the server (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET missing)"
    );
    error.statusCode = 503;
    throw error;
  }

  return config;
}

function purgeExpiredStates() {
  const now = Date.now();
  for (const [state, expiry] of pendingStates) {
    if (expiry < now) pendingStates.delete(state);
  }
}

/**
 * Build the Google consent URL. The `state` is a one-shot CSRF token: Google
 * hands it back on the callback, which cannot carry the admin key because it
 * arrives as a browser redirect from Google rather than from our own panel.
 */
function buildAuthUrl() {
  const config = configOrThrow();
  const state = require("crypto").randomBytes(24).toString("hex");

  purgeExpiredStates();
  pendingStates.set(state, Date.now() + STATE_TTL_MS);

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    // offline + consent together are what actually guarantee a refresh token:
    // Google omits it on repeat authorisations unless consent is forced.
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });

  return `${AUTH_URL}?${params}`;
}

/** One-shot: a state can be redeemed once, and only before it expires. */
function consumeState(state) {
  purgeExpiredStates();

  if (!state || !pendingStates.has(state)) {
    return false;
  }

  pendingStates.delete(state);
  return true;
}

async function postToken(body) {
  const response = await fetch(tokenUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.error) {
    const detail = payload.error_description || payload.error || `HTTP ${response.status}`;
    const error = new Error(`Google rejected the token request: ${detail}`);
    error.statusCode = 502;
    throw error;
  }

  return payload;
}

/**
 * Exchange the one-time code for tokens, discover which address was connected,
 * and store the encrypted refresh token. Replaces any existing connection.
 */
async function connectWithCode(code) {
  const config = configOrThrow();

  const tokens = await postToken({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
  });

  if (!tokens.refresh_token) {
    const error = new Error(
      "Google did not return a refresh token. Remove the app at myaccount.google.com/permissions and connect again."
    );
    error.statusCode = 502;
    throw error;
  }

  const profileResponse = await fetch(userinfoUrl(), {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const profile = await profileResponse.json().catch(() => ({}));

  if (!profileResponse.ok || !profile.email) {
    const error = new Error("Connected, but could not read the account address from Google");
    error.statusCode = 502;
    throw error;
  }

  const account = await MailAccount.findOneAndUpdate(
    { key: "gmail" },
    {
      key: "gmail",
      email: profile.email,
      refreshToken: encrypt(tokens.refresh_token),
      connectedAt: new Date(),
    },
    { new: true, upsert: true, runValidators: true }
  );

  cachedAccessToken = tokens.access_token;
  cachedAccessExpiry = Date.now() + (Number(tokens.expires_in) || 3600) * 1000 - 60000;

  return { email: account.email, connectedAt: account.connectedAt };
}

/** The connected account, or null. Never exposes the refresh token. */
async function getConnectedAccount() {
  const account = await MailAccount.findOne({ key: "gmail" });
  return account ? { email: account.email, connectedAt: account.connectedAt } : null;
}

async function disconnect() {
  cachedAccessToken = null;
  cachedAccessExpiry = 0;
  const result = await MailAccount.deleteOne({ key: "gmail" });
  return result.deletedCount > 0;
}

/** Mint (or reuse) an access token from the stored refresh token. */
async function getAccessToken() {
  if (cachedAccessToken && Date.now() < cachedAccessExpiry) {
    return cachedAccessToken;
  }

  const config = configOrThrow();
  const account = await MailAccount.findOne({ key: "gmail" }).select("+refreshToken");

  if (!account) {
    const error = new Error("No Gmail account is connected. Connect one in the admin panel.");
    error.statusCode = 503;
    throw error;
  }

  let refreshToken;
  try {
    refreshToken = decrypt(account.refreshToken);
  } catch {
    // Almost always a rotated ADMIN_KEY / TOKEN_ENCRYPTION_KEY.
    const error = new Error(
      "The stored Gmail credential could not be read. Disconnect and connect the account again."
    );
    error.statusCode = 503;
    throw error;
  }

  const tokens = await postToken({
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "refresh_token",
  });

  cachedAccessToken = tokens.access_token;
  cachedAccessExpiry = Date.now() + (Number(tokens.expires_in) || 3600) * 1000 - 60000;

  return cachedAccessToken;
}

/** Compose RFC 2822 and encode it the way the Gmail API expects. */
async function buildRawMessage({ from, to, subject, text }) {
  const built = await new MailComposer({ from, to, subject, text }).compile().build();

  return built
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Send as the connected account. Throws on failure — the admin is waiting to
 * be told whether the mail actually went out.
 */
async function sendViaGmail({ to, subject, text }) {
  const accessToken = await getAccessToken();
  const account = await MailAccount.findOne({ key: "gmail" });
  const from = account?.email;

  const raw = await buildRawMessage({ from, to, subject, text });

  const response = await fetch(sendUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.error) {
    const detail = payload.error?.message || `HTTP ${response.status}`;
    const error = new Error(`Gmail refused the message: ${detail}`);
    error.statusCode = 502;
    throw error;
  }

  return { messageId: payload.id, accepted: [to], rejected: [], from };
}

module.exports = {
  isGmailConfigured,
  buildAuthUrl,
  consumeState,
  connectWithCode,
  getConnectedAccount,
  disconnect,
  sendViaGmail,
  SCOPES,
};
