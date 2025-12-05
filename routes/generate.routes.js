import { Router } from "express";
import { generateController } from "../controllers/generate.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Protected: Only logged-in users can generate tests
router.post("/", authMiddleware, generateController);

export default router;


