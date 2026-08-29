const mongoose = require("mongoose");

/**
 * The one Gmail account the arena has connected. Stored in the database rather
 * than .env because the admin connects it at runtime through the panel.
 *
 * `key` is a fixed literal with a unique index, which makes this a singleton
 * collection: there is only ever one connected account, and reconnecting
 * overwrites it rather than piling up stale rows.
 */
const mailAccountSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "gmail",
      unique: true,
      immutable: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    // AES-256-GCM ciphertext from services/tokenCrypto.js — never plain text,
    // and never returned by any API response.
    refreshToken: {
      type: String,
      required: true,
      select: false,
    },
    connectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.refreshToken;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model("MailAccount", mailAccountSchema);
