import { Router } from "express";
import { readmeController } from "../controllers/readme.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Protected endpoint
router.post("/", authMiddleware, readmeController);

export default router;
