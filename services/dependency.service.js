import path from "path";

/**
 * Build dependency graph that maps each file to a list of imported files.
 */
export function buildDependencyGraph(files, repoRoot) {
  console.log("🕸 Building dependency graph...");

  const graph = {};

  // Fast lookup for available files
  const fileMap = {};
  for (const file of files) {
    const normalized = file.relative.replace(/\\/g, "/");
    fileMap[normalized] = true;
  }

  for (const file of files) {
    const filePath = file.relative.replace(/\\/g, "/");
    const content = file.content;

    const imports = extractImports(content);
    graph[filePath] = [];

    for (let imp of imports) {
      if (!imp) continue;

      // Build clean normalized path
      const baseDir = path.dirname(filePath);
      const joined = path.join(baseDir, imp);
      const resolved = joined.replace(/\\/g, "/");

      // Try resolving file extensions
      const finalPath =
        tryResolve(resolved, fileMap) ||
        tryResolve(resolved + ".js", fileMap) ||
        tryResolve(resolved + ".ts", fileMap) ||
        tryResolve(resolved + ".jsx", fileMap) ||
        tryResolve(resolved + ".tsx", fileMap) ||
        tryResolve(resolved + ".mjs", fileMap) ||
        tryResolve(resolved + ".cjs", fileMap);

      if (finalPath) {
        graph[filePath].push(finalPath);
      }
    }
  }

  return graph;
}

/**
 * Extract import and require paths from code using regex.
 */
function extractImports(code) {
  const results = [];

  const importRegex =
    /import\s+(?:[\s\S]+?\s+from\s+)?["'](.+?)["']/g;

  const requireRegex =
    /require\(\s*["'](.+?)["']\s*\)/g;

  let match;
  while ((match = importRegex.exec(code)) !== null) {
    results.push(match[1]);
  }
  while ((match = requireRegex.exec(code)) !== null) {
    results.push(match[1]);
  }

  // Only relative imports
  return results.filter((p) => p.startsWith("."));
}

/**
 * Only resolves modules that exist in our fileMap
 */
function tryResolve(candidate, fileMap) {
  const normalized = candidate.replace(/\\/g, "/");
  return fileMap[normalized] ? normalized : null;
}


