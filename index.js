require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const userRoutes = require("./routes/UserRoute");

app.use(cors());
app.use(express.json());

// DB Connection
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error("❌ MONGODB_URI not set in .env");
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => console.log("✅ Connected to MongoDB1"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes
app.use("/api/user", userRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0',() => {
  console.log(`🚀 Server running on port ${PORT}`);
});
