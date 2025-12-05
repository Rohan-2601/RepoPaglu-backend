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
- RETURN ONLY VALID JSON. NO MARKDOWN. NO code fences.
- If authentication middleware is detected on a route, set authRequired=true.
- Infer request body fields based on validator usage or destructuring.
- Extract ALL Express routes: router.get(), router.post(), router.put(), router.delete()
- Skip no routes.
- Use best professional descriptions based on code.

### CONTROLLER FILES:
${controllerData
  .map(c => `FILE: ${c.file}\n\n${c.content}`)
  .join("\n\n---\n\n")}
`.trim();

  // Generate response
  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();

  // Clean accidental code fences if present
  text = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  // Safely parse JSON
  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    console.error("❌ Gemini returned invalid JSON:", text);
    throw new Error("Gemini returned invalid JSON for API docs.");
  }

  // Ensure always returns array
  if (!Array.isArray(json)) {
    throw new Error("Gemini did not return a JSON array for API docs.");
  }

  return json;
}

