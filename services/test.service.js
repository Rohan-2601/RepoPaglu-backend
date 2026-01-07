import { generateTestsForBatch } from "../llm/groq.js";


export class TestGenerator {
  constructor(batches) {
    this.batches = batches; // array of batches (each contains multiple files)
  }

  /**
   * Process all batches sequentially.
   * You can make this parallel later.
   */
  async run() {
    const allTests = [];

    let batchIndex = 0;

    for (const batch of this.batches) {
      batchIndex++;
      console.log(`🧪 Processing batch ${batchIndex}/${this.batches.length}...`);

      try {
        const result = await generateTestsForBatch(batch);

        if (!Array.isArray(result)) {
          console.warn("⚠ Bad batch result:", result);
          continue;
        }

        // Normalize results
        for (const item of result) {
          if (!item.file || !item.test) {
            console.warn("⚠ Skipping invalid test item:", item);
            continue;
          }

          allTests.push({
            file: item.file,
            test: item.test,
          });
        }

      } catch (err) {
        console.error(`❌ Batch ${batchIndex} failed:`, err.message);
      }
    }

    return allTests;
  }
}



