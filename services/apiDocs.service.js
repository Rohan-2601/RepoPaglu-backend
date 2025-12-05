import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_KEY } from "../config/env.js";

const genAI = new GoogleGenerativeAI(GEMINI_KEY);

/**
 * Extract controllers from project files.
 * Returns: [{ file: "controller.js", content: "..." }]
 */
export function extractControllerInfo(files) {
  return files
    .filter(f => f.relative.toLowerCase().includes("controller"))
    .map(f => ({
      file: f.relative,
      content: f.content
    }));
}

/**
 * Generate STRUCTURED JSON API documentation using Gemini.
 * Returns: Array of controllers and their routes
 */
export async function generateApiDocs(controllerData) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash"
  });

  const prompt = `
You are an API documentation extractor.

Analyze the following Express.js controller files and extract structured API documentation.

### OUTPUT FORMAT (STRICT JSON ONLY):
Return a JSON array. Each item must be:

{
  "controller": "string",
  "routes": [
    {
      "method": "GET" | "POST" | "PUT" | "DELETE",
      "path": "string",
      "description": "string",
      "authRequired": boolean,
      "params": { "...": "string" },
      "query": { "...": "string" },
      "body": { "...": "string" },
      "responses": {
        "200": "string",
        "400": "string",
        "401": "string",
        "404": "string",
        "500": "string"
      }
    }
  ]
}

### EXTRA RULES
- RETURN ONLY VALID JSON. NO MARKDOWN.
- If authentication middleware is found, authRequired=true.
- Extract ALL Express routes.
- Infer params/body/query from destructuring.
- Skip nothing.

### CONTROLLER FILES:
${controllerData
  .map(c => `FILE: ${c.file}\n\n${c.content}`)
  .join("\n\n---\n\n")}
`.trim();

  try {
    // Call Gemini
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    // Clean accidental fences
    text = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // Parse JSON safely
    let json;
    try {
      json = JSON.parse(text);
    } catch (err) {
      console.error("❌ Gemini returned invalid JSON:", text);
      throw {
        status: 500,
        message: "AI returned invalid JSON for API documentation."
      };
    }

    // Validate structure
    if (!Array.isArray(json)) {
      throw {
        status: 500,
        message: "AI did not return a JSON array for API documentation."
      };
    }

    return json;

  } catch (error) {
    // Handle rate limit
    if (error.status === 429 || error?.message?.includes("429")) {
      console.error("⚠️ Gemini Rate Limit Hit:", error.message);

      throw {
        status: 429,
        message: "AI is rate-limited. Try again in a few seconds."
      };
    }

    // Unknown errors
    console.error("🔥 Gemini API Error (API Docs):", error);

    throw {
      status: 500,
      message: "AI service failed while generating API documentation."
    };
  }
}

