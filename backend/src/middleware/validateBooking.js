const { PLATFORMS, STATUSES, PHONE_PATTERN, PHONE_MESSAGE } = require("../models/Booking");

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
  const platform = isString(body.platform) ? body.platform.trim() : "PS5";
  const message = isString(body.message) ? body.message.trim() : "";

  if (name.length < 2 || name.length > 80) {
    errors.push("Name must be between 2 and 80 characters");
  }
  if (!PHONE_PATTERN.test(phone)) {
    errors.push(PHONE_MESSAGE);
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
  req.booking = { name, phone, platform, message };
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

module.exports = { validateBookingPayload, validateStatusPayload };
