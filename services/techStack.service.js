import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_KEY } from "../config/env.js";

const genAI = new GoogleGenerativeAI(GEMINI_KEY);

/**
 * Collect content from project files
 */
export function collectProjectFiles(files) {
  return files.map(f => ({
    file: f.relative,
    content: f.content
  }));
}

/**
 * Generate STRUCTURED TECH STACK REPORT
 */
export async function generateTechStackReport(projectFiles) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash"
  });

  const prompt = `
You are a senior software architect.

Analyze the following project files and return a **STRICT JSON OBJECT** describing the project's tech stack.

### OUTPUT FORMAT (STRICT JSON ONLY):
{
  "languages": [],
  "frameworks": [],
  "packageManager": "",
  "architecture": "",
  "libraries": [],
  "database": "",
  "externalServices": [],
  "auth": "",
  "fileUpload": "",
  "routing": "",
  "errorHandling": "",
  "logging": "",
  "envVars": [],
  "deployment": "",
  "strengths": [],
  "weaknesses": [],
  "recommendations": []
}

### IMPORTANT RULES:
- RETURN STRICT JSON ONLY. NO MARKDOWN. NO BACKTICKS.
- If something is unknown, return an empty array or empty string.
- Infer technologies from filenames, imports, and patterns.
- Identify Express patterns, multer, cloudinary, mongoose, JWT, bcrypt, etc.
- Do NOT add explanations outside JSON.

### PROJECT FILES:
${projectFiles
  .map(p => `FILE: ${p.file}\n\n${p.content}`)
  .join("\n\n-----\n\n")}
`;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    // Remove accidental code fences
    text = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // Try parsing JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("❌ Gemini returned invalid JSON:", text);
      throw {
        status: 500,
        message: "AI returned invalid JSON for tech stack.",
      };
    }

    return data;

  } catch (error) {
    // Handle specific Gemini rate limit error
    if (error.status === 429 || error?.message?.includes("429")) {
      console.error("⚠️ Gemini rate limit hit:", error.message);

      throw {
        status: 429,
        message: "AI is receiving too many requests. Please try again shortly.",
      };
    }

    // Handle unknown errors
    console.error("🔥 Gemini API Error:", error);

    throw {
      status: 500,
      message: "AI service failed unexpectedly.",
    };
  }
}

