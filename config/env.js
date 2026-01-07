import dotenv from "dotenv";
dotenv.config();

// Required Environment Variables
export const GEMINI_KEY = process.env.GEMINI_KEY;
export const HF_KEY = process.env.HF_KEY;



// Auth System
export const JWT_SECRET = process.env.JWT_SECRET || "supersecretfallback"; 

// Database
export const MONGO_URI = process.env.MONGO_URI;

// Server Port
export const PORT = process.env.PORT || 5000;

// Debug



