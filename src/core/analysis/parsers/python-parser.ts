import { type ILanguageParser } from "./base-parser.js";
import {
  type AnalysisResult,
  type ExtractedSymbol,
  type ExtractedImport,
  type ExtractedExport,
  type ExtractedRelationship
} from "../types.js";

export class PythonParser implements ILanguageParser {
  parse(filePath: string, content: string): AnalysisResult {
    const lines = content.split("\n");
    const symbols: ExtractedSymbol[] = [];
    const imports: ExtractedImport[] = [];
    const exports: ExtractedExport[] = [];
    const relationships: ExtractedRelationship[] = [];

    // Track active class context for methods
    interface ScopeContext {
      name: string;
      kind: "class" | "function";
      indent: number;
      startLine: number;
    }
    const scopeStack: ScopeContext[] = [];

    let currentDecorators: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const rawLine = lines[i];
      const trimmed = rawLine.trim();

      // Skip blank lines and full-line comments
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      // Compute indentation level
      const indent = rawLine.search(/\S/);

      // Pop scopes that are deeper than or equal to current indentation
      while (scopeStack.length > 0 && indent <= scopeStack[scopeStack.length - 1].indent) {
        scopeStack.pop();
      }

      // 1. Decorators: @decorator or @app.get("/path")
      if (trimmed.startsWith("@")) {
        currentDecorators.push(trimmed);
        continue;
      }

      // 2. Imports: from x import y, z or import a, b
      const fromImportMatch = trimmed.match(/^from\s+([a-zA-Z0-9_.]+)\s+import\s+(.+)$/);
      if (fromImportMatch) {
        const modulePath = fromImportMatch[1];
        const specifiers = fromImportMatch[2].split(",").map(s => {
          const parts = s.trim().split(/\s+as\s+/);
          return { name: parts[0].trim(), isTypeOnly: false };
        });

        imports.push({
          moduleSpecifier: modulePath,
          namedImports: specifiers,
          startLine: lineNum,
          endLine: lineNum
        });

        for (const spec of specifiers) {
          relationships.push({
            sourceName: filePath,
            targetName: spec.name,
            type: "IMPORTS",
            startLine: lineNum
          });
        }
        currentDecorators = [];
        continue;
      }

      const directImportMatch = trimmed.match(/^import\s+(.+)$/);
      if (directImportMatch) {
        const modules = directImportMatch[1].split(",").map(m => m.trim().split(/\s+as\s+/)[0]);
        for (const mod of modules) {
          imports.push({
            moduleSpecifier: mod,
            namedImports: [{ name: mod, isTypeOnly: false }],
            startLine: lineNum,
            endLine: lineNum
          });
          relationships.push({
            sourceName: filePath,
            targetName: mod,
            type: "IMPORTS",
            startLine: lineNum
          });
        }
        currentDecorators = [];
        continue;
      }

      // 3. Classes: class ClassName(Base1, Base2):
      const classMatch = trimmed.match(/^class\s+([a-zA-Z0-9_]+)(?:\((.*?)\))?\s*:/);
      if (classMatch) {
        const className = classMatch[1];
        const baseClasses = classMatch[2] ? classMatch[2].split(",").map(b => b.trim()) : [];
        const endLine = this.findScopeEndLine(lines, i, indent);
        const docComment = this.extractDocstring(lines, i + 1);

        symbols.push({
          name: className,
          kind: "class",
          filePath,
          startLine: lineNum,
          endLine,
          signature: currentDecorators.length > 0
            ? `${currentDecorators.join(" ")} class ${className}`
            : `class ${className}`,
          docComment,
          isExported: !className.startsWith("_")
        });

        if (!className.startsWith("_")) {
          exports.push({
            name: className,
            isDefault: false,
            startLine: lineNum,
            endLine: lineNum
          });
        }

        relationships.push({
          sourceName: className,
          targetName: baseClasses.join(", ") || undefined,
          type: "DEFINES",
          startLine: lineNum
        });

        scopeStack.push({
          name: className,
          kind: "class",
          indent,
          startLine: lineNum
        });

        currentDecorators = [];
        continue;
      }

      // 4. Functions & Methods: def func_name(...) or async def func_name(...)
      const funcMatch = trimmed.match(/^(?:async\s+)?def\s+([a-zA-Z0-9_]+)\s*\((.*?)\)(?:\s*->\s*(.+?))?\s*:/);
      if (funcMatch) {
        const rawFuncName = funcMatch[1];
        const params = funcMatch[2] || "";
        const returnType = funcMatch[3] || "";
        const endLine = this.findScopeEndLine(lines, i, indent);
        const docComment = this.extractDocstring(lines, i + 1);

        const currentScope = scopeStack[scopeStack.length - 1];
        const isMethod = currentScope && currentScope.kind === "class";
        const fullName = isMethod ? `${currentScope.name}.${rawFuncName}` : rawFuncName;
        const kind = isMethod ? "method" : "function";

        const signatureParts = [];
        if (currentDecorators.length > 0) {
          signatureParts.push(currentDecorators.join(" "));
        }
        signatureParts.push(`def ${rawFuncName}(${params})${returnType ? ` -> ${returnType}` : ""}`);

        symbols.push({
          name: fullName,
          kind,
          filePath,
          startLine: lineNum,
          endLine,
          signature: signatureParts.join(" "),
          docComment,
          isExported: !rawFuncName.startsWith("_")
        });

        if (!rawFuncName.startsWith("_") && !isMethod) {
          exports.push({
            name: rawFuncName,
            isDefault: false,
            startLine: lineNum,
            endLine: lineNum
          });
        }

        relationships.push({
          sourceName: fullName,
          type: "DEFINES",
          startLine: lineNum
        });

        // Scan for function calls within the body
        const bodyLines = lines.slice(i, endLine);
        const callMatches = this.findCallsInLines(bodyLines, fullName, lineNum);
        relationships.push(...callMatches);

        scopeStack.push({
          name: fullName,
          kind: "function",
          indent,
          startLine: lineNum
        });

        currentDecorators = [];
        continue;
      }

      // Reset decorators if not followed by class/def
      if (currentDecorators.length > 0 && !trimmed.startsWith("@")) {
        currentDecorators = [];
      }
    }

    return { symbols, imports, exports, relationships };
  }

  private findScopeEndLine(lines: string[], startIdx: number, baseIndent: number): number {
    let lastNonEmpty = startIdx + 1;
    for (let j = startIdx + 1; j < lines.length; j++) {
      const line = lines[j];
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const indent = line.search(/\S/);
      if (indent <= baseIndent) {
        return lastNonEmpty;
      }
      lastNonEmpty = j + 1;
    }
    return lines.length;
  }

  private extractDocstring(lines: string[], startIdx: number): string | undefined {
    if (startIdx >= lines.length) return undefined;
    const line = lines[startIdx].trim();
    if (line.startsWith('"""') || line.startsWith("'''")) {
      const quote = line.slice(0, 3);
      const after = line.slice(3);
      if (after.includes(quote)) {
        return after.split(quote)[0].trim();
      }
      const docLines = [after];
      for (let j = startIdx + 1; j < lines.length; j++) {
        const next = lines[j].trim();
        if (next.includes(quote)) {
          docLines.push(next.split(quote)[0]);
          break;
        }
        docLines.push(next);
      }
      return docLines.join(" ").trim();
    }
    return undefined;
  }

  private findCallsInLines(lines: string[], callerName: string, startLine: number): ExtractedRelationship[] {
    const calls: ExtractedRelationship[] = [];
    const seen = new Set<string>();

    for (let k = 0; k < lines.length; k++) {
      const l = lines[k].trim();
      const callRegex = /([a-zA-Z0-9_.]+)\s*\(/g;
      let match;
      while ((match = callRegex.exec(l)) !== null) {
        const callee = match[1];
        if (
          !callee.startsWith("def") &&
          !callee.startsWith("class") &&
          callee !== callerName &&
          callee !== "print" &&
          callee !== "len" &&
          callee !== "range" &&
          callee !== "super" &&
          !seen.has(callee)
        ) {
          seen.add(callee);
          calls.push({
            sourceName: callerName,
            targetName: callee,
            type: "CALLS",
            startLine: startLine + k
          });
        }
      }
    }
    return calls;
  }
}
