const Booking = require("../models/Booking");
const { sendBookingAcknowledgement } = require("../services/whatsapp");

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** POST /api/bookings — public. Called by the booking form on the site. */
const createBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.create(req.booking);

  res.status(201).json({
    success: true,
    message: "Byee.",
    data: booking,
  });

  // Fire-and-forget, deliberately after the response: the acknowledgement must
  // never add Meta's latency to the booking, nor turn a saved booking into an
  // error. The service swallows everything; this .catch is a second line of
  // defence — a rejection reaching errorHandler after headers were sent would
  // abort the 201 the customer already has.
  sendBookingAcknowledgement(booking).catch(() => {});
});

/** GET /api/bookings — admin. Supports ?status=&limit=&page= */
const listBookings = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

  const filter = {};
  if (Booking.STATUSES.includes(req.query.status)) {
    filter.status = req.query.status;
  }

  const [items, total] = await Promise.all([
    Booking.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Booking.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
  });
});

/** GET /api/bookings/:id — admin. */
const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({ success: false, message: "Booking not found" });
  }

  return res.json({ success: true, data: booking });
});

/** PATCH /api/bookings/:id/status — admin. */
const updateBookingStatus = asyncHandler(async (req, res) => {
  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    { status: req.bookingStatus },
    { new: true, runValidators: true }
  );

  if (!booking) {
    return res.status(404).json({ success: false, message: "Booking not found" });
  }

  return res.json({ success: true, data: booking });
});

/** DELETE /api/bookings/:id — admin. */
const deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findByIdAndDelete(req.params.id);

  if (!booking) {
    return res.status(404).json({ success: false, message: "Booking not found" });
  }

  return res.json({ success: true, message: "Booking deleted" });
});

module.exports = {
  createBooking,
  listBookings,
  getBooking,
  updateBookingStatus,
  deleteBooking,
};
