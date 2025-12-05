import { cloneRepo, cleanupTemp } from "../services/repo.service.js";
import { extractAndFilterFiles } from "../services/file.service.js";
import { buildDependencyGraph } from "../services/dependency.service.js";
import { generateSummary } from "../services/summary.service.js";
import { generateReadmeContent } from "../services/readme.service.js";

export const readmeController = async (req, res) => {
  let repoPath = null;

  try {
    const { repo } = req.body;
    if (!repo) return res.status(400).json({ error: "Missing 'repo' field." });

    repoPath = await cloneRepo(repo);

    // Extract files
    const files = await extractAndFilterFiles(repoPath);

    // Build graph
    const dependencyGraph = buildDependencyGraph(files, repoPath);

    // Summaries
    const summaries = {};
    for (const file of files) {
      summaries[file.relative] = generateSummary(file, dependencyGraph);
    }

    // Generate README content
    const readme = await generateReadmeContent(files, summaries);

    return res.json({
      success: true,
      readme
    });

  } catch (err) {
    console.error("README Error:", err.message);
    return res.status(500).json({ error: err.message });
  } finally {
    if (repoPath) await cleanupTemp(repoPath);
  }
};
