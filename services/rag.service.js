import path from "path";

/**
 * Optimized RAG system without embeddings.
 *
 * Combines:
 * - TF-IDF text similarity (local)
 * - Dependency graph proximity
 * - Folder proximity
 * - Export-name matching
 * - Weighted score fusion
 */
export class RagEngine {
  constructor(store, dependencyGraph) {
    this.store = store; // stores { file, summary }
    this.graph = dependencyGraph;
  }

  /**
   * Main method to fetch best RAG context.
   */
  async getContextForFile(filePath, summary) {
    const similarFiles = this._rankFiles(filePath, summary).slice(0, 5);

    const imports = this.graph[filePath]?.imports || [];
    const importedBy = this.graph[filePath]?.importedBy || [];

    return {
      similarFiles,
      imports,
      importedBy,
    };
  }

  /**
   * Rank files using multiple similarity signals.
   */
  _rankFiles(targetFile, targetSummary) {
    const results = [];

    for (const item of this.store.index) {
      if (item.file === targetFile) continue;

      const score =
        0.45 * this._tfidf(targetSummary, item.summary) +
        0.25 * this._dependencyScore(targetFile, item.file) +
        0.15 * this._folderProximity(targetFile, item.file) +
        0.15 * this._exportNameMatch(targetSummary, item.summary);

      results.push({
        file: item.file,
        score,
      });
    }

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Simple TF-IDF scoring.
   */
  _tfidf(a, b) {
    const freq = (text) => {
      const map = {};
      const words = text.toLowerCase().split(/\W+/);
      for (const w of words) {
        if (!w) continue;
        map[w] = (map[w] || 0) + 1;
      }
      return map;
    };

    const fa = freq(a);
    const fb = freq(b);

    let score = 0;
    for (const w in fa) {
      if (fb[w]) score += Math.min(fa[w], fb[w]);
    }

    return score;
  }

  /**
   * Dependency link score (imports / importedBy).
   */
  _dependencyScore(a, b) {
    const importsA = this.graph[a]?.imports || [];
    const importsB = this.graph[b]?.imports || [];
    const importedByA = this.graph[a]?.importedBy || [];
    const importedByB = this.graph[b]?.importedBy || [];

    let score = 0;

    if (importsA.includes(b)) score += 2.0;
    if (importsB.includes(a)) score += 2.0;
    if (importedByA.includes(b)) score += 1.5;
    if (importedByB.includes(a)) score += 1.5;

    return score;
  }

  /**
   * Files in the same folder / sibling folders get better scores.
   */
  _folderProximity(a, b) {
    const dirA = path.dirname(a);
    const dirB = path.dirname(b);

    if (dirA === dirB) return 1.0; // same folder
    if (path.dirname(dirA) === path.dirname(dirB)) return 0.6; // sibling folder
    return 0;
  }

  /**
   * Try matching exported names in summaries (simple heuristic).
   */
  _exportNameMatch(aSummary, bSummary) {
    const regex = /(function|class|variable)\s+([a-zA-Z0-9_]+)/g;

    const extract = (text) => {
      const arr = [];
      let m;
      while ((m = regex.exec(text)) !== null) arr.push(m[2].toLowerCase());
      return arr;
    };

    const aNames = extract(aSummary);
    const bNames = extract(bSummary);

    for (const name of aNames) {
      if (bNames.includes(name)) return 1.0;
    }

    return 0;
  }
}


