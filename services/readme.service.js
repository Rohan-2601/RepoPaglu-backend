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

  const result = await model.generateContent(prompt);
  let content = result.response.text();

// Remove ```markdown and ``` wrappers if present
content = content.replace(/```markdown/gi, "").replace(/```/g, "").trim();

return content;

}
