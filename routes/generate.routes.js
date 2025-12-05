import { Router } from "express";
import { generateController } from "../controllers/generate.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { createRateLimiter } from "../middlewares/rateLimit.js";

const router = Router();
const apiDocsLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, 
  max: 3                 
});

router.post("/", authMiddleware, apiDocsLimiter, generateController);

export default router;


