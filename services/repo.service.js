import simpleGit from "simple-git";
import fs from "fs";
import path from "path";
import os from "os";
import { rm } from "fs/promises";

/**
 * Clone repo into a TEMP folder (stateless, scalable)
 */
export async function cloneRepo(repoUrl) {
  console.log("📥 Cloning repo:", repoUrl);

  // Create temporary folder inside OS tmp
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "repo-"));

  try {
    const git = simpleGit();

    // Shallow clone for speed
    await git.clone(repoUrl, tempDir, ["--depth", "1"]);

    return tempDir;
  } catch (err) {
    console.error("❌ Clone failed:", err.message);

    // Clean temp folder if clone fails
    await rm(tempDir, { recursive: true, force: true });

    throw new Error("Failed to clone repository.");
  }
}

/**
 * Cleanup temporary repo directory after use
 */
export async function cleanupTemp(dir) {
  if (!dir) return;

  try {
    await rm(dir, { recursive: true, force: true });
    console.log("🧹 Temp cleaned:", dir);
  } catch (err) {
    console.error("⚠ Cleanup error:", err.message);
  }
}


