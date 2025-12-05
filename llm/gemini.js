import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_KEY } from "../config/env.js";
import { createBatchPrompt } from "./prompt.js";

const genAI = new GoogleGenerativeAI(GEMINI_KEY);

/**
 * Safe JSON parse that ignores failures.
 */
function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Normalize Gemini output by stripping markdown, code fences, etc.
 */
function sanitizeLine(line) {
  return line
    .replace(/^```json/, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();
}

/**
 * Generate tests for ONE batch using Gemini 2.0 Flash (streaming).
 */
export async function generateTestsForBatch(batch) {
  const prompt = createBatchPrompt(batch);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
  });

  const result = await model.generateContentStream({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  let buffer = "";
  const tests = [];

  for await (const chunk of result.stream) {
    const text = chunk.text();
    buffer += text;

    // split into possible NDJSON lines
    let lines = buffer.split("\n");
    buffer = lines.pop(); // keep last incomplete line

    for (let line of lines) {
      line = sanitizeLine(line);

      if (!line || line.startsWith("{") === false) continue;

      const obj = safeParse(line);
      if (obj && obj.file && obj.test) {
        tests.push(obj);
      }
    }
  }

  // handle leftover buffer
  const final = sanitizeLine(buffer);
  const obj = safeParse(final);
  if (obj && obj.file && obj.test) {
    tests.push(obj);
  }

  return tests;
}








