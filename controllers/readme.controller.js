import { cloneRepo, cleanupTemp } from "../services/repo.service.js";
import { extractAndFilterFiles } from "../services/file.service.js";
import { buildDependencyGraph } from "../services/dependency.service.js";
import { generateSummary } from "../services/summary.service.js";
import { generateReadmeContent } from "../services/readme.service.js";

export const readmeController = async (req, res) => {
  let repoPath = null;

  try {
    const { repo } = req.body;

    if (!repo) {
      return res.status(400).json({
        success: false,
        message: "Missing 'repo' field."
      });
    }

    // Clone repository
    repoPath = await cloneRepo(repo);

    // Extract project files
    const files = await extractAndFilterFiles(repoPath);

    // Build dependency graph
    const dependencyGraph = buildDependencyGraph(files, repoPath);

    // Generate summaries per file
    const summaries = {};
    for (const file of files) {
      summaries[file.relative] = generateSummary(file, dependencyGraph);
    }

    // Generate README content (AI call)
    const readme = await generateReadmeContent(files, summaries);

    return res.status(200).json({
      success: true,
      readme
    });

  } catch (err) {
    console.error("README Generation Error:", err);

    const status = err.status || 500;
    const message = err.message || "Something went wrong while generating the README.";

    return res.status(status).json({
      success: false,
      message
    });

  } finally {
    if (repoPath) {
      await cleanupTemp(repoPath).catch(() => {
        console.error("Cleanup failed during README generation.");
      });
    }
  }
};
