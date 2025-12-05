import { Router } from "express";
import { techStackController } from "../controllers/techStack.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authMiddleware, techStackController);

export default router;
