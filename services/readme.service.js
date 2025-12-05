import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_KEY } from "../config/env.js";

const genAI = new GoogleGenerativeAI(GEMINI_KEY);

export async function generateReadmeContent(files, summaries) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash"
  });

  const summaryText = Object.values(summaries).join("\n\n");

  const prompt = `
Write a clean, professional README.md for this project.

Guidelines:
- Include project description
- Include features list
- Include API endpoints (if any)
- Include folder structure
- Include setup instructions
- Include installation & running instructions
- Include tech stack
- Explain key modules
- Use GitHub-friendly markdown formatting
- Keep it concise but professional

Here are summaries of all files in the repo:
${summaryText}

Begin now:
  `.trim();

  try {
    const result = await model.generateContent(prompt);
    let content = result.response.text();

    // Clean code fences
    content = content
      .replace(/```markdown/gi, "")
      .replace(/```/g, "")
      .trim();

    return content;

  } catch (error) {

    // Gemini 429 — Most common with Flash model
    if (error.status === 429 || error?.message?.includes("429")) {
      console.error("⚠️ Gemini Rate Limit Hit:", error.message);

      throw {
        status: 429,
        message: "AI is overloaded. Please retry in a few seconds.",
      };
    }

    // Other unexpected issues
    console.error("🔥 Gemini README Generator Error:", error);

    throw {
      status: 500,
      message: "Failed to generate README due to an internal AI error.",
    };
  }
}
