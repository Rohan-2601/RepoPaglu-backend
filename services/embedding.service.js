// embedding.service.js
// Embedding removed — now we store summaries only.

export class EmbeddingStore {
  constructor() {
    this.index = []; // store { file, summary }
  }

  // Add summaries (no vector generation)
  async add(filePath, summary) {
    this.index.push({ file: filePath, summary });
  }

  // Simple word-overlap similarity for ranking
  search(querySummary, topK = 5) {
    const scored = this.index.map(item => ({
      ...item,
      score: this._score(querySummary, item.summary),
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  _score(a, b) {
    const aWords = new Set(a.toLowerCase().split(/\W+/));
    const bWords = new Set(b.toLowerCase().split(/\W+/));
    let overlap = 0;
    for (const w of aWords) {
      if (bWords.has(w)) overlap++;
    }
    return overlap;
  }
}





