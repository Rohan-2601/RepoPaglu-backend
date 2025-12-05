import { cloneRepo, cleanupTemp } from "../services/repo.service.js";
import { extractAndFilterFiles } from "../services/file.service.js";
import { collectProjectFiles, generateTechStackReport } from "../services/techStack.service.js";

export const techStackController = async (req, res) => {
  let repoPath = null;

  try {
    const { repo } = req.body;

    if (!repo) {
      return res.status(400).json({
        success: false,
        message: "Missing repo URL",
      });
    }

    // Clone repo
    repoPath = await cloneRepo(repo);

    // Extract project files
    const files = await extractAndFilterFiles(repoPath);

    if (!files.length) {
      return res.status(400).json({
        success: false,
        message: "No files found to analyze.",
      });
    }

    // Prepare file data
    const projectFiles = collectProjectFiles(files);

    // Generate tech stack analysis (AI call)
    const report = await generateTechStackReport(projectFiles);

    return res.status(200).json({
      success: true,
      report,
    });

  } catch (err) {
    console.error("Tech Stack Controller Error:", err);

    // Respect custom status thrown inside Gemini service
    const status = err.status || 500;
    const message = err.message || "Failed to generate tech stack report.";

    return res.status(status).json({
      success: false,
      message,
    });

  } finally {
    if (repoPath) {
      await cleanupTemp(repoPath).catch(() => {
        console.error("Cleanup failed after tech stack analysis.");
      });
    }
  }
};

