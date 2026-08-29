/**
 * Encrypts the Google refresh token before it touches the database.
 *
 * A refresh token is a long-lived credential that can send mail as the arena's
 * Gmail account, so it must not sit in Mongo as plain text — a database dump
 * would otherwise hand someone that ability.
 */

const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
// Fixed salt: the secret is already high-entropy, and a stored per-record salt
// would buy nothing here while making the value harder to rotate.
const SALT = "venom-gaming-mail-token";

/**
 * Falls back to ADMIN_KEY so the feature works without extra setup. Rotating
 * whichever key is in use invalidates the stored token, and the admin simply
 * reconnects Gmail — which is the correct outcome for a rotated secret.
 */
function getKey() {
  const secret = process.env.TOKEN_ENCRYPTION_KEY || process.env.ADMIN_KEY;

  if (!secret) {
    const error = new Error("Cannot store credentials: TOKEN_ENCRYPTION_KEY or ADMIN_KEY must be set");
    error.statusCode = 503;
    throw error;
  }

  return crypto.scryptSync(secret, SALT, 32);
}

/** Returns "iv.authTag.ciphertext", all base64. */
function encrypt(plain) {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);

  return [iv.toString("base64"), cipher.getAuthTag().toString("base64"), enc.toString("base64")].join(".");
}

/**
 * Reverses encrypt(). Throws if the value was tampered with or if the key has
 * changed since it was written — GCM authenticates, so a wrong key fails loudly
 * rather than returning garbage.
 */
function decrypt(payload) {
  const [ivB64, tagB64, dataB64] = String(payload).split(".");

  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Stored credential is malformed");
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

module.exports = { encrypt, decrypt };
