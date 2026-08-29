/**
 * WhatsApp Cloud API booking acknowledgements.
 *
 * Deliberately the opposite policy to config/db.js: a missing or broken WhatsApp
 * setup must never stop the arena taking bookings. Nothing in here throws — every
 * path resolves with a result object and logs to console.error.
 */

const DEFAULT_BASE_URL = "https://graph.facebook.com";
const DEFAULT_API_VERSION = "v23.0";
const DEFAULT_TEMPLATE_NAME = "booking_ack";
const DEFAULT_TEMPLATE_LANGUAGE = "en";
const DEFAULT_COUNTRY_CODE = "91";

const REQUEST_TIMEOUT_MS = 8000;

// Meta rejects a template parameter that is empty, or that contains a newline, a
// tab, or more than four consecutive spaces. It also caps the rendered body at
// 1024 characters. `message` is free text up to 500 chars, so cap each parameter
// at 120: four parameters worst case is 480, leaving room for the fixed copy.
// It is also the practical limit for a readable bubble on a phone — the arena
// still has the full text in the admin list.
const MAX_PARAM_LENGTH = 120;

// The labels the customer actually saw in the <select>, so the echo matches the
// form they filled in. Kept in sync with src/app/components/BookingForm.js.
const PLATFORM_LABELS = {
  PS5: "PS5 seat",
  PC: "Gaming PC seat",
  Squad: "Squad pack (4 seats)",
  Event: "Tournament / private event",
};

const STATUS_LABELS = {
  pending: "Pending confirmation",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

// One warning per process, not one per booking, so an unconfigured deployment is
// obvious in the logs without drowning them.
let warnedNotConfigured = false;

/**
 * Read WhatsApp settings from the environment. Returns null (and warns exactly
 * once) when the integration is not configured.
 */
function readConfig() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    if (!warnedNotConfigured) {
      warnedNotConfigured = true;
      console.error(
        "WhatsApp not configured (WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN missing). " +
          "Booking acknowledgements are disabled. See .env.example. Logged once per process."
      );
    }
    return null;
  }

  return {
    phoneNumberId,
    accessToken,
    baseUrl: (process.env.WHATSAPP_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, ""),
    apiVersion: process.env.WHATSAPP_API_VERSION || DEFAULT_API_VERSION,
    templateName: process.env.WHATSAPP_TEMPLATE_NAME || DEFAULT_TEMPLATE_NAME,
    templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || DEFAULT_TEMPLATE_LANGUAGE,
    countryCode: (process.env.WHATSAPP_COUNTRY_CODE || DEFAULT_COUNTRY_CODE).replace(/\D/g, ""),
  };
}

/**
 * Make a value safe to use as a WhatsApp template parameter: strip control
 * characters, collapse every whitespace run to one space, trim, truncate, and
 * fall back when the result is empty.
 */
function sanitiseParam(value, fallback) {
  const collapsed = String(value ?? "")
    // \s does not cover C0/C1 control characters, which pasted text can carry.
    // eslint-disable-next-line no-control-regex -- deliberately stripping controls.
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ")
    // One pass kills newlines, tabs and long runs — all three Meta rejections.
    .replace(/\s+/g, " ")
    .trim();

  if (!collapsed) {
    return fallback;
  }
  if (collapsed.length <= MAX_PARAM_LENGTH) {
    return collapsed;
  }
  return `${collapsed.slice(0, MAX_PARAM_LENGTH - 3).trimEnd()}...`;
}

/**
 * Bare 10-digit Indian mobile -> the digits-only international form Meta wants.
 * Numbers that already carry a country code pass through untouched.
 */
function toWhatsAppNumber(phone, countryCode = DEFAULT_COUNTRY_CODE) {
  const digits = String(phone ?? "").replace(/\D/g, "");

  if (digits.length === 0) {
    return "";
  }
  if (digits.length > 10) {
    return digits;
  }
  return `${countryCode}${digits}`;
}

/** Booking fields -> {{1}}..{{4}} in the approved template, in order. */
function buildParameters(booking) {
  return [
    sanitiseParam(booking?.name, "there"),
    sanitiseParam(PLATFORM_LABELS[booking?.platform] || booking?.platform, "a seat"),
    sanitiseParam(booking?.message, "not specified"),
    sanitiseParam(STATUS_LABELS[booking?.status] || booking?.status, "Pending confirmation"),
  ].map((text) => ({ type: "text", text }));
}

/**
 * Send the acknowledgement for a newly created booking.
 *
 * Never throws and never rejects: every failure resolves with { sent: false }
 * after logging. Safe to call fire-and-forget from a controller.
 */
async function sendBookingAcknowledgement(booking) {
  const ref = booking?._id ? String(booking._id) : "unknown";

  try {
    const config = readConfig();
    if (!config) {
      return { sent: false, skipped: "not-configured" };
    }

    const to = toWhatsAppNumber(booking?.phone, config.countryCode);
    if (!to) {
      console.error(`WhatsApp acknowledgement skipped for booking ${ref}: no phone number.`);
      return { sent: false, skipped: "no-phone" };
    }

    const url = `${config.baseUrl}/${config.apiVersion}/${config.phoneNumberId}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "template",
      template: {
        name: config.templateName,
        language: { code: config.templateLanguage },
        components: [{ type: "body", parameters: buildParameters(booking) }],
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    // Read once as text: some Graph errors come back as HTML or an empty body,
    // and .json() would throw and lose the diagnostic entirely.
    const raw = await response.text();
    let body = null;
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch {
      body = null;
    }

    // Graph can answer 200 with an error payload, and 200 with no message id at
    // all, so success needs all three checks.
    const messageId = body?.messages?.[0]?.id;
    if (!response.ok || body?.error || !messageId) {
      const err = body?.error;
      const detail = err
        ? `${err.message} (code ${err.code}` +
          `${err.error_subcode ? `/${err.error_subcode}` : ""}, fbtrace ${err.fbtrace_id})`
        : raw.slice(0, 300) || "empty response body";
      console.error(
        `WhatsApp acknowledgement failed for booking ${ref}: HTTP ${response.status} — ${detail}`
      );
      return { sent: false, status: response.status };
    }

    // message_status can be "held_for_quality_assessment" — accepted, but paused.
    const messageStatus = body.messages[0].message_status;
    if (messageStatus && messageStatus !== "accepted") {
      console.error(
        `WhatsApp acknowledgement for booking ${ref} accepted with status "${messageStatus}".`
      );
    }

    return { sent: true, messageId, to };
  } catch (error) {
    const reason =
      error?.name === "TimeoutError"
        ? `request timed out after ${REQUEST_TIMEOUT_MS}ms`
        : `${error?.name || "Error"}: ${error?.message || error}`;
    console.error(`WhatsApp acknowledgement error for booking ${ref}: ${reason}`);
    return { sent: false, error: true };
  }
}

module.exports = {
  sendBookingAcknowledgement,
  // Exported for tests.
  sanitiseParam,
  toWhatsAppNumber,
  buildParameters,
  MAX_PARAM_LENGTH,
  PLATFORM_LABELS,
  STATUS_LABELS,
};
