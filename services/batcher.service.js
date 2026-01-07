export class Batcher {
  constructor(files, summaries, ragEngine) {
    this.files = files;
    this.summaries = summaries;
    this.rag = ragEngine;
    this.batchSize = 3;
  }

  async createBatches() {
    const batches = [];
    let current = [];

    for (const file of this.files) {
      const filePath = file.relative;
      const summary = this.summaries[filePath];

      // Correct parameter order: (filePath, summary)
      let context = {};
      try {
        context = await this.rag.getContextForFile(filePath, summary);
      } catch (err) {
        console.error("RAG context error:", err.message);
      }

      current.push({
        file: filePath,
        code: file.content,
        summary,
        context,
      });

      if (current.length >= this.batchSize) {
        batches.push(current);
        current = [];
      }
    }

    if (current.length > 0) batches.push(current);

    return batches;
  }
}


