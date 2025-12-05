// LOAD ENV FIRST — MUST BE FIRST
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import app from "./app.js";
import { PORT, MONGO_URI } from "../config/env.js";

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("📦 MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 TestForge V2 backend running on port ${PORT}`);
});







