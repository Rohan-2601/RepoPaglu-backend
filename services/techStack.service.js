import { generateWithHF } from "../llm/groq.js";

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
 * Generate STRUCTURED TECH STACK REPORT using Hugging Face
 */
export async function generateTechStackReport(projectFiles) {
  const prompt = `
You are a senior software architect.

Analyze the following project files and return a STRICT JSON OBJECT describing the project's tech stack.

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
  .map(
    p =>
      `FILE: ${p.file}\nSUMMARY:\n${p.summary || "No summary available"}`
  )
  .join("\n\n-----\n\n")}
`.trim();

  try {
    let text = await generateWithHF(prompt);

    // Clean accidental fences
    text = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("❌ AI returned invalid JSON for tech stack:", text);
      throw {
        status: 500,
        message: "AI returned invalid JSON for tech stack.",
      };
    }

    return data;

  } catch (error) {
    console.error("🔥 AI service failed while generating tech stack:", error);

    throw {
      status: 500,
      message: "AI service failed while generating tech stack.",
    };
  }
}
