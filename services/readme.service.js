import { generateWithHF } from "../llm/groq.js";

/**
 * Generate README.md content using Hugging Face
 */
export async function generateReadmeContent(files, summaries) {
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
    let content = await generateWithHF(prompt);

    // Clean accidental markdown fences
    content = content
      .replace(/```markdown/gi, "")
      .replace(/```/g, "")
      .trim();

    return content;

  } catch (error) {
    console.error("🔥 AI README Generator Error:", error);

    throw {
      status: 500,
      message: "Failed to generate README due to an AI error.",
    };
  }
}
