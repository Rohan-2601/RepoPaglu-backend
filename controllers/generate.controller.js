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
      return res.status(400).json({ error: "Missing 'repo' field." });
    }

    console.log("⚡ Received repo:", repo);


    repoPath = await cloneRepo(repo);

    
    const files = await extractAndFilterFiles(repoPath);
    console.log(`📄 Filtered files: ${files.length}`);

    if (files.length === 0) {
      return res.status(400).json({ error: "No valid source files found." });
    }

    // 3️⃣ Build dependency graph
    const dependencyGraph = buildDependencyGraph(files, repoPath);

    // 4️⃣ Generate summaries
    console.log("📝 Creating summaries...");
    const summaries = {};
    for (const file of files) {
      summaries[file.relative] = generateSummary(file, dependencyGraph);
    }

    // 5️⃣ Create lightweight embedding store
    console.log("🧠 Indexing summaries...");
    const store = new EmbeddingStore();
    for (const file of files) {
      await store.add(file.relative, summaries[file.relative]);
    }

    // 6️⃣ RAG Engine
    console.log("🔍 Initializing RAG engine...");
    const rag = new RagEngine(store, dependencyGraph);

    // 7️⃣ Batching
    console.log("📦 Creating batches...");
    const batcher = new Batcher(files, summaries, rag);
    const batches = await batcher.createBatches();
    console.log(`📦 Total batches: ${batches.length}`);

    // 8️⃣ LLM test generation
    console.log("🤖 Generating tests...");
    const generator = new TestGenerator(batches);
    const testFiles = await generator.run();

    if (testFiles.length === 0) {
      return res.status(500).json({ error: "LLM generated no test files." });
    }

    // 9️⃣ Create ZIP in memory
    const zipBuffer = await createZipBuffer(testFiles);

    // 🔟 Return ZIP as direct download (no file saved)
    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="tests.zip"`,
    });

    return res.send(zipBuffer);

  } catch (error) {
    console.error("❌ Controller Error:", error);
    return res.status(500).json({ error: error.message });
  } finally {
    // 🧹 Cleanup temp folder always
    if (repoPath) await cleanupTemp(repoPath);
  }
};



