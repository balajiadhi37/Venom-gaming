const express = require("express");
const rateLimit = require("express-rate-limit");

const controller = require("../controllers/bookingController");
const { validateBookingPayload, validateStatusPayload } = require("../middleware/validateBooking");
const { requireAdmin } = require("../middleware/requireAdmin");

const router = express.Router();

// The create endpoint is public, so cap how often one IP can submit.
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many booking requests. Please try again later." },
});

router.post("/", createLimiter, validateBookingPayload, controller.createBooking);

router.get("/", requireAdmin, controller.listBookings);
router.get("/:id", requireAdmin, controller.getBooking);
router.patch("/:id/status", requireAdmin, validateStatusPayload, controller.updateBookingStatus);
router.delete("/:id", requireAdmin, controller.deleteBooking);

module.exports = router;
