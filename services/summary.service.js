import * as babelParser from "@babel/parser";

/**
 * Extract exports: functions, classes, variables, default
 */
function extractExports(ast) {
  const out = [];

  if (!ast || !ast.program?.body) return out;

  for (const node of ast.program.body) {
    if (node.type === "ExportNamedDeclaration") {
      const decl = node.declaration;

      if (decl) {
        if (decl.type === "FunctionDeclaration" && decl.id) {
          out.push(`function ${decl.id.name}`);
        }

        if (decl.type === "ClassDeclaration" && decl.id) {
          out.push(`class ${decl.id.name}`);
        }

        if (decl.type === "VariableDeclaration") {
          decl.declarations.forEach((d) => {
            if (d.id?.name) out.push(`variable ${d.id.name}`);
          });
        }
      }

      if (node.specifiers?.length) {
        node.specifiers.forEach((s) => {
          if (s.exported?.name) out.push(`export ${s.exported.name}`);
        });
      }
    }

    if (node.type === "ExportDefaultDeclaration") {
      out.push("default export");
    }
  }

  return out;
}

function parseCode(code) {
  return babelParser.parse(code, {
    sourceType: "module",
    plugins: [
      "jsx",
      "typescript",
      "classProperties",
      "classPrivateProperties",
      "classPrivateMethods",
      "decorators-legacy",
      "topLevelAwait",
    ],
  });
}

/**
 * Build compact meaningful summary for RAG embeddings.
 */
export function generateSummary(file, dependencyGraph) {
  try {
    const code = file.content;
    const rel = file.relative.replace(/\\/g, "/");

    const ast = parseCode(code);
    const exportsList = extractExports(ast);
    const deps = dependencyGraph[rel]?.imports || [];

    return `
File: ${rel}
Exports: ${exportsList.join(", ") || "none"}
Dependencies: ${deps.join(", ") || "none"}
Code size: ${code.length} chars
`.trim();
  } catch (err) {
    console.error(`❌ Summary parse error (${file.relative}):`, err.message);

    return `
File: ${file.relative}
Exports: unknown (parse failed)
Dependencies: ${(dependencyGraph[file.relative]?.imports || []).join(", ") || "none"}
`.trim();
  }
}




