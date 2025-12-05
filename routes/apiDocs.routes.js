import { Router } from "express";
import { apiDocsController } from "../controllers/apiDocs.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authMiddleware, apiDocsController);

export default router;
