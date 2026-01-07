import Groq from "groq-sdk";
import { createBatchPrompt } from "./prompt.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Generic text generation function (used by README, API docs, Tech Stack)
 */
export async function generateWithHF(prompt) {
  const res = await groq.chat.completions.create({
  model: "llama-3.1-8b-instant",
  messages: [{ role: "user", content: prompt }],
  temperature: 0.2,
  max_tokens: 1200,
});


  return res.choices[0].message.content;
}

/**
 * Generate tests for ONE batch
 */
export async function generateTestsForBatch(batch) {
  const prompt = createBatchPrompt(batch);
  const output = await generateWithHF(prompt);

  const tests = [];
  for (const line of output.split("\n")) {
    const clean = line.trim();
    if (!clean.startsWith("{")) continue;

    try {
      const obj = JSON.parse(clean);
      if (obj.file && obj.test) tests.push(obj);
    } catch {}
  }

  return tests;
}
