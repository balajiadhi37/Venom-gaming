const express = require("express");

const gmail = require("../services/gmail");
const { getMailStatus } = require("../services/mailer");
const { requireAdmin } = require("../middleware/requireAdmin");

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Where to send the admin's browser once the OAuth round trip finishes. */
function adminPanelUrl() {
  const origin = (process.env.CORS_ORIGIN || "http://localhost:3000").split(",")[0].trim();
  return `${origin.replace(/\/+$/, "")}/admin`;
}

/** GET /api/mail/status — which provider is live and whether it can send. */
router.get(
  "/status",
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await getMailStatus() });
  })
);

/**
 * GET /api/mail/gmail/connect — admin. Returns the Google consent URL for the
 * panel to send the browser to. Does not redirect itself: the panel calls this
 * with the admin key over fetch, which cannot follow a cross-origin redirect.
 */
router.get(
  "/gmail/connect",
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: { url: gmail.buildAuthUrl() } });
  })
);

/**
 * GET /api/mail/gmail/callback — Google redirects the browser here.
 *
 * Deliberately NOT behind requireAdmin: the request comes from Google, not from
 * the panel, so it cannot carry the admin key. The one-shot `state` issued by
 * /connect is what proves this callback belongs to an admin-initiated flow.
 * Always redirects back to the panel so the admin never sees raw JSON.
 */
router.get(
  "/gmail/callback",
  asyncHandler(async (req, res) => {
    const back = (params) => res.redirect(`${adminPanelUrl()}?${new URLSearchParams(params)}`);

    if (req.query.error) {
      return back({ gmail: "error", reason: String(req.query.error) });
    }
    if (!gmail.consumeState(String(req.query.state || ""))) {
      return back({ gmail: "error", reason: "This sign-in link has expired. Try connecting again." });
    }
    if (!req.query.code) {
      return back({ gmail: "error", reason: "Google did not return an authorisation code." });
    }

    try {
      const account = await gmail.connectWithCode(String(req.query.code));
      return back({ gmail: "connected", account: account.email });
    } catch (err) {
      console.error("Gmail connect failed:", err.message);
      return back({ gmail: "error", reason: err.message });
    }
  })
);

/** POST /api/mail/gmail/disconnect — admin. Forgets the stored credential. */
router.post(
  "/gmail/disconnect",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const removed = await gmail.disconnect();
    res.json({
      success: true,
      message: removed ? "Gmail account disconnected" : "No Gmail account was connected",
    });
  })
);

module.exports = router;
