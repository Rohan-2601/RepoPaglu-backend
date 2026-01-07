import { generateWithHF } from "../llm/groq.js";

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
 * Generate STRUCTURED JSON API documentation using AI
 * Returns: Array of controllers and their routes
 */
export async function generateApiDocs(controllerData) {
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

### RULES
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
    let text = await generateWithHF(prompt);

    // Remove markdown fences if any
    text = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let json;
    try {
      // ✅ ROBUST FIX: extract JSON array only
      const start = text.indexOf("[");
      const end = text.lastIndexOf("]");

      if (start === -1 || end === -1) {
        throw new Error("No JSON array found in AI response");
      }

      const extractedJson = text.slice(start, end + 1);
      json = JSON.parse(extractedJson);

    } catch (err) {
      console.error("❌ Failed to parse API docs JSON:", text);
      throw {
        status: 500,
        message: "AI returned malformed JSON for API documentation."
      };
    }

    if (!Array.isArray(json)) {
      throw {
        status: 500,
        message: "AI did not return a JSON array for API documentation."
      };
    }

    return json;

  } catch (error) {
    console.error("🔥 AI service failed while generating API docs:", error);

    throw {
      status: 500,
      message: "AI service failed while generating API documentation."
    };
  }
}
