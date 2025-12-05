import { cloneRepo, cleanupTemp } from "../services/repo.service.js";
import { extractAndFilterFiles } from "../services/file.service.js";
import { buildDependencyGraph } from "../services/dependency.service.js";
import { generateSummary } from "../services/summary.service.js";
import { EmbeddingStore } from "../services/embedding.service.js";
import { RagEngine } from "../services/rag.service.js";
import { Batcher } from "../services/batcher.service.js";
import { TestGenerator } from "../services/test.service.js";
import { createZipBuffer } from "../services/zip.service.js";

export const generateController = async (req, res) => {
  let repoPath = null;

  try {
    const { repo } = req.body;

    if (!repo) {
      return res.status(400).json({
        success: false,
        message: "Missing 'repo' field."
      });
    }

    console.log("⚡ Received repo:", repo);

    // Clone the repository
    repoPath = await cloneRepo(repo);

    // Extract valid project files
    const files = await extractAndFilterFiles(repoPath);
    console.log(`📄 Filtered files: ${files.length}`);

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid source files found."
      });
    }

    // Build dependency graph
    const dependencyGraph = buildDependencyGraph(files, repoPath);

    // Generate summaries per file
    console.log("📝 Creating summaries...");
    const summaries = {};
    for (const file of files) {
      summaries[file.relative] = generateSummary(file, dependencyGraph);
    }

    // Embedding store
    console.log("🧠 Indexing summaries...");
    const store = new EmbeddingStore();
    for (const file of files) {
      await store.add(file.relative, summaries[file.relative]);
    }

    // RAG Engine
    console.log("🔍 Initializing RAG engine...");
    const rag = new RagEngine(store, dependencyGraph);

    // Batcher
    console.log("📦 Creating batches...");
    const batcher = new Batcher(files, summaries, rag);
    const batches = await batcher.createBatches();
    console.log(`📦 Total batches: ${batches.length}`);

    // Test generation (LLM)
    console.log("🤖 Generating tests...");
    const generator = new TestGenerator(batches);
    const testFiles = await generator.run();

    if (testFiles.length === 0) {
      return res.status(500).json({
        success: false,
        message: "AI failed to generate test files."
      });
    }

    // Create zip buffer
    const zipBuffer = await createZipBuffer(testFiles);

    // Send ZIP
    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="tests.zip"`
    });

    return res.status(200).send(zipBuffer);

  } catch (err) {
    console.error("❌ Test Generation Controller Error:", err);

    // Respect structured errors from AI service
    const status = err.status || 500;

    return res.status(status).json({
      success: false,
      message: err.message || "Something went wrong during test generation."
    });

  } finally {
    if (repoPath) {
      await cleanupTemp(repoPath).catch(() => {
        console.error("🧹 Temp cleanup failed during test generation.");
      });
    }
  }
};




