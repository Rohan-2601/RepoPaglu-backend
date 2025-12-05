import rateLimit from "express-rate-limit";

export function createRateLimiter({ windowMs, max }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,       // Adds `RateLimit-*` headers
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests. Try again later."
    }
  });
}
