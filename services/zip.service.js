import AdmZip from "adm-zip";
import path from "path";

/**
 * Convert a source file path (e.g. "/src/app.js")
 * into a test file path inside the ZIP.
 * Example: tests/src/app.test.js
 */
function convertToTestPath(originalPath) {
  if (!originalPath) return null;

  const clean = originalPath.replace(/\\/g, "/"); // normalize Windows paths
  const ext = path.extname(clean);
  const base = clean.replace(ext, "");

  return `tests${base}.test${ext}`;
}

/**
 * Creates an in-memory ZIP buffer containing test files.
 * NO files written to disk.
 */
export async function createZipBuffer(testFiles) {
  console.log("📦 Creating ZIP in memory...");

  const zip = new AdmZip();

  for (const item of testFiles) {
    if (!item || !item.file || !item.test) {
      console.warn("⚠ Skipping invalid test item:", item);
      continue;
    }

    const testFilePath = convertToTestPath(item.file);
    if (!testFilePath) {
      console.warn("⚠ Invalid file path, skipping:", item.file);
      continue;
    }

    zip.addFile(testFilePath, Buffer.from(item.test, "utf8"));
  }

  // Return raw ZIP buffer (no writing to disk)
  return zip.toBuffer();
}






