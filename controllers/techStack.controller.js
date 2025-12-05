import { cloneRepo, cleanupTemp } from "../services/repo.service.js";
import { extractAndFilterFiles } from "../services/file.service.js";
import { collectProjectFiles, generateTechStackReport } from "../services/techStack.service.js";

export const techStackController = async (req, res) => {
  let repoPath = null;

  try {
    const { repo } = req.body;
    if (!repo) return res.status(400).json({ error: "Missing repo URL" });

    // Clone to temp
    repoPath = await cloneRepo(repo);

    // Extract files
    const files = await extractAndFilterFiles(repoPath);

    if (!files.length) {
      return res.status(400).json({ error: "No files found to analyze." });
    }

    // Collect content
    const projectFiles = collectProjectFiles(files);

    // Generate stack report
    const report = await generateTechStackReport(projectFiles);

    return res.json({
      success: true,
      report
    });

  } catch (err) {
    console.error("Tech Stack Error:", err.message);
    return res.status(500).json({ error: err.message });
  } finally {
    if (repoPath) cleanupTemp(repoPath);
  }
};
