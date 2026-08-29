const mongoose = require("mongoose");

// Kept in sync with the <select> options in src/app/components/BookingForm.js
const PLATFORMS = ["PS5", "PC", "Squad", "Event"];
const STATUSES = ["pending", "confirmed", "cancelled"];

// Phone numbers are normalised to bare digits by validateBooking.js before they
// get here, so the pattern only has to count digits — no separators to allow.
// Kept in sync with the phone input in src/app/components/BookingForm.js
const PHONE_PATTERN = /^[0-9]{10}$/;
const PHONE_MESSAGE = "Phone number must be exactly 10 digits";

// Deliberately permissive: one @, no whitespace, a dot in the domain. Stricter
// patterns reject real addresses for no benefit — the real test is whether mail
// to it bounces. Kept in sync with the email input in BookingForm.js.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MESSAGE = "Email address is not valid";
const EMAIL_MAX = 120;

const bookingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [80, "Name must be at most 80 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [PHONE_PATTERN, PHONE_MESSAGE],
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      trim: true,
      lowercase: true,
      maxlength: [EMAIL_MAX, `Email must be at most ${EMAIL_MAX} characters`],
      match: [EMAIL_PATTERN, EMAIL_MESSAGE],
    },
    platform: {
      type: String,
      required: [true, "Platform is required"],
      enum: { values: PLATFORMS, message: "{VALUE} is not a bookable seat type" },
      default: "PS5",
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, "Message must be at most 500 characters"],
      default: "",
    },
    status: {
      type: String,
      enum: { values: STATUSES, message: "{VALUE} is not a valid status" },
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// Newest bookings first on the admin list.
bookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Booking", bookingSchema);
module.exports.PLATFORMS = PLATFORMS;
module.exports.STATUSES = STATUSES;
module.exports.PHONE_PATTERN = PHONE_PATTERN;
module.exports.PHONE_MESSAGE = PHONE_MESSAGE;
module.exports.EMAIL_PATTERN = EMAIL_PATTERN;
module.exports.EMAIL_MESSAGE = EMAIL_MESSAGE;
module.exports.EMAIL_MAX = EMAIL_MAX;
