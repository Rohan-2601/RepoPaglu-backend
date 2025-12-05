import { cloneRepo, cleanupTemp } from "../services/repo.service.js";
import { extractAndFilterFiles } from "../services/file.service.js";
import { extractControllerInfo, generateApiDocs } from "../services/apiDocs.service.js";

export const apiDocsController = async (req, res) => {
  let repoPath = null;

  try {
    const { repo } = req.body;
    if (!repo) {
      return res.status(400).json({
        success: false,
        message: "Missing repo URL",
      });
    }

    // Clone repository
    repoPath = await cloneRepo(repo);

    // Extract files
    const files = await extractAndFilterFiles(repoPath);

    // Extract controllers
    const controllers = extractControllerInfo(files);

    if (!controllers.length) {
      return res.status(400).json({
        success: false,
        message: "No controllers found to document.",
      });
    }

    // Generate API documentation
    const docs = await generateApiDocs(controllers);

    return res.status(200).json({
      success: true,
      docs,
    });

  } catch (err) {
    console.error("API Docs Error:", err);

    // Handle structured errors thrown by services
    const status = err.status || 500;

    return res.status(status).json({
      success: false,
      message: err.message || "Something went wrong while generating API docs.",
    });

  } finally {
    if (repoPath) {
      await cleanupTemp(repoPath).catch(() => {
        console.error("Cleanup failed.");
      });
    }
  }
};

