import { cloneRepo, cleanupTemp } from "../services/repo.service.js";
import { extractAndFilterFiles } from "../services/file.service.js";
import { extractControllerInfo, generateApiDocs } from "../services/apiDocs.service.js";

export const apiDocsController = async (req, res) => {
  let repoPath = null;

  try {
    const { repo } = req.body;
    if (!repo) return res.status(400).json({ error: "Missing repo URL" });

    repoPath = await cloneRepo(repo);

    // Extract code files
    const files = await extractAndFilterFiles(repoPath);

    // Extract controller details
    const controllers = extractControllerInfo(files);

    if (!controllers.length) {
      return res.status(400).json({
        error: "No controllers found to document."
      });
    }

    // Generate docs
    const docs = await generateApiDocs(controllers);

    return res.json({
      success: true,
      docs
    });

  } catch (err) {
    console.error("API Docs Error:", err.message);
    return res.status(500).json({ error: err.message });
  } finally {
    if (repoPath) await cleanupTemp(repoPath);
  }
};
