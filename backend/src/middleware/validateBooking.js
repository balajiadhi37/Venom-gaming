const {
  PLATFORMS,
  STATUSES,
  PHONE_PATTERN,
  PHONE_MESSAGE,
  EMAIL_PATTERN,
  EMAIL_MESSAGE,
  EMAIL_MAX,
} = require("../models/Booking");

const { SUBJECT_MAX, BODY_MAX } = require("../services/mailer");

const isString = (value) => typeof value === "string";

/**
 * Boundary validation for the public booking form. Mongoose validates again on
 * save; this layer rejects junk shapes (arrays, objects, numbers) before they
 * ever reach the database and normalises what we keep.
 */
function validateBookingPayload(req, res, next) {
  const body = req.body || {};
  const errors = [];

  const name = isString(body.name) ? body.name.trim() : "";
  // Drop separators so "98765 43210" and "(98765) 43210" are judged on their digits.
  const phone = isString(body.phone) ? body.phone.replace(/\D/g, "") : "";
  // Lowercased so "Bob@Gmail.com" and "bob@gmail.com" are one address.
  const email = isString(body.email) ? body.email.trim().toLowerCase() : "";
  const platform = isString(body.platform) ? body.platform.trim() : "PS5";
  const message = isString(body.message) ? body.message.trim() : "";

  if (name.length < 2 || name.length > 80) {
    errors.push("Name must be between 2 and 80 characters");
  }
  if (!PHONE_PATTERN.test(phone)) {
    errors.push(PHONE_MESSAGE);
  }
  if (!EMAIL_PATTERN.test(email) || email.length > EMAIL_MAX) {
    errors.push(EMAIL_MESSAGE);
  }
  if (!PLATFORMS.includes(platform)) {
    errors.push(`Platform must be one of: ${PLATFORMS.join(", ")}`);
  }
  if (message.length > 500) {
    errors.push("Message must be at most 500 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  // Only the whitelisted fields survive — no status or _id injection from the client.
  req.booking = { name, phone, email, platform, message };
  return next();
}

function validateStatusPayload(req, res, next) {
  const status = isString(req.body?.status) ? req.body.status.trim() : "";

  if (!STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: [`Status must be one of: ${STATUSES.join(", ")}`],
    });
  }

  req.bookingStatus = status;
  return next();
}

/** Admin composes the subject and body, so validate both before we send. */
function validateEmailPayload(req, res, next) {
  const subject = isString(req.body?.subject) ? req.body.subject.trim() : "";
  const text = isString(req.body?.body) ? req.body.body.trim() : "";
  const errors = [];

  if (subject.length < 1 || subject.length > SUBJECT_MAX) {
    errors.push(`Subject must be between 1 and ${SUBJECT_MAX} characters`);
  }
  if (text.length < 1 || text.length > BODY_MAX) {
    errors.push(`Message must be between 1 and ${BODY_MAX} characters`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  req.mail = { subject, text };
  return next();
}

module.exports = { validateBookingPayload, validateStatusPayload, validateEmailPayload };
