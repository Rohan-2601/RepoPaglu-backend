import fs from "fs";
import path from "path";

const MAX_FILE_SIZE = 100 * 1024; // 100 KB
const MIN_LINES = 20;

const IGNORED_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  ".next",
  "coverage",
  ".git",
  "public",
  "assets",
  "vendor",
  "migrations",
]);

const IGNORED_FILES = new Set([
  "vite.config.js",
  "vite.config.ts",
  "next.config.js",
  "eslint.config.js",
  "eslint.config.ts",
  "jest.config.js",
  "jest.config.ts",
  "tailwind.config.js",
  "tailwind.config.ts",
  "postcss.config.js",
  "postcss.config.ts",
]);

export async function extractAndFilterFiles(repoPath) {
  console.log("📄 Extracting & filtering files from:", repoPath);

  const result = [];

  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // ignore exact folder names only, not substrings
        if (IGNORED_DIRS.has(entry.name)) continue;
        walk(full);
        continue;
      }

      // ignore exact filenames only
      if (IGNORED_FILES.has(entry.name)) continue;

      // Only process JS/TS/JSX/TSX
      if (!/\.(js|ts|jsx|tsx)$/.test(entry.name)) continue;

      const stat = fs.statSync(full);
      if (stat.size > MAX_FILE_SIZE) continue;

      const content = fs.readFileSync(full, "utf8");
      const lineCount = content.split(/\r?\n/).length;
      if (lineCount < MIN_LINES) continue;

      // Build clean relative path
      const relative = full
        .replace(repoPath, "")
        .replace(/\\/g, "/")
        .replace(/^\//, "");

      result.push({
        fullPath: full,
        relative,
        content,
      });
    }
  };

  walk(repoPath);
  return result;
}



