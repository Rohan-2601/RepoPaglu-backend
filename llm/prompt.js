/**
 * Create a safe prompt for generating NDJSON tests.
 * This version prevents hallucinations and invalid JSON.
 */
export function createBatchPrompt(batch) {
  return `
You are a strict JSON generator. 
Your job is to produce **ONLY NDJSON**, where each line is one valid JSON object.

### HARD RULES — MUST FOLLOW
- Output ONLY NDJSON lines.
- One JSON object per line.
- Each line MUST be valid JSON.
- Each object MUST contain ONLY: { "file": "...", "test": "..." }
- DO NOT output explanations.
- DO NOT output code fences.
- DO NOT output markdown.
- DO NOT output commentary.
- DO NOT output multi-line JSON.
- DO NOT output JavaScript outside of the JSON string.
- DO NOT write multiple objects in one line.
- DO NOT write blank lines.

### JSON SAFETY RULES
- ALWAYS escape quotes inside the "test" string.
- ALWAYS escape newlines as \\n inside JSON.
- NEVER include backticks.
- NEVER include template literals like \`...\`.
- NEVER include unescaped "${" or "}" inside the JSON structure.

### NDJSON TEMPLATE (MUST FOLLOW EXACTLY)
{"file": "<path>", "test": "<jest test code escaped properly>"}

### FILES TO PROCESS:
${batch
  .map((f) => {
    return `
FILE: ${f.file}

SUMMARY:
${f.summary}

CONTEXT:
${Array.isArray(f.context) ? f.context.join("\n") : ""}

SOURCE (READ ONLY):
${f.code}
`;
  })
  .join("\n")}

### NOW GENERATE:
Output EXACTLY one NDJSON line per file.
Begin output immediately.
  `.trim();
}
