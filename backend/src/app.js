const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const bookingRoutes = require("./routes/bookings");
const mailRoutes = require("./routes/mail");
const { notFound, errorHandler } = require("./middleware/errorHandler");

function buildAllowedOrigins() {
  return (process.env.CORS_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function createApp() {
  const app = express();
  const allowedOrigins = buildAllowedOrigins();

  app.set("trust proxy", 1);

  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin / curl / server-to-server requests send no Origin header.
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin not allowed by CORS: ${origin}`));
      },
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "x-admin-key"],
    })
  );

  app.use(express.json({ limit: "10kb" }));

  app.get("/api/health", (req, res) => {
    res.json({
      success: true,
      status: "ok",
      db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      uptime: Math.round(process.uptime()),
    });
  });

  app.use("/api/bookings", bookingRoutes);
  app.use("/api/mail", mailRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
