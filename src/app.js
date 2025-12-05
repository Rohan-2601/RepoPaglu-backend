import express from "express";
import cors from "cors";

import authRoutes from "../routes/auth.routes.js";
import generateRoutes from "../routes/generate.routes.js";
import readmeRoutes from "../routes/readme.routes.js";
import apiDocsRoutes from "../routes/apiDocs.routes.js";
import techStackRoutes from "../routes/techStack.routes.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "20mb" }));   

// Routes
app.use("/auth", authRoutes);                // Register & Login
app.use("/api/generate", generateRoutes);    // Protected generation route
app.use("/api/readme", readmeRoutes);        


app.use("/api/docs", apiDocsRoutes);
app.use("/api/tech", techStackRoutes);



export default app;


