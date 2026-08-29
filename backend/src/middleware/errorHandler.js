function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity.
function errorHandler(err, req, res, next) {
  if (err?.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err?.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid identifier" });
  }

  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Request body is not valid JSON" });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
}

module.exports = { notFound, errorHandler };
