const mongoose = require("mongoose");

/**
 * Connect to MongoDB. Throws if MONGODB_URI is missing so the process fails
 * loudly at boot instead of on the first request.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env and fill it in.");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`MongoDB connected: ${mongoose.connection.name}`);

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err.message);
  });

  return mongoose.connection;
}

module.exports = { connectDB };
