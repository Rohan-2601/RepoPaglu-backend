import { Router } from "express";
import { apiDocsController } from "../controllers/apiDocs.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { createRateLimiter } from "../middlewares/rateLimit.js";

const router = Router();


const apiDocsLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, 
  max: 10                  
});

router.post("/", authMiddleware, apiDocsLimiter, apiDocsController);

export default router;
