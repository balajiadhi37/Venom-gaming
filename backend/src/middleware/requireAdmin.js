const crypto = require("crypto");

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Guards the endpoints that read or change bookings. The public form only ever
 * needs POST /api/bookings, so everything else sits behind a shared secret.
 */
function requireAdmin(req, res, next) {
  const expected = process.env.ADMIN_KEY;

  if (!expected) {
    return res.status(503).json({ success: false, message: "Admin access is not configured" });
  }

  const provided = req.get("x-admin-key") || "";

  if (!safeEqual(provided, expected)) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  return next();
}

module.exports = { requireAdmin };
