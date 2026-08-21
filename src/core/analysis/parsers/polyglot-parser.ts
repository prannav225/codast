import path from "node:path";
import { type ILanguageParser } from "./base-parser.js";
import {
  type AnalysisResult,
  type ExtractedSymbol,
  type ExtractedImport,
  type ExtractedExport,
  type ExtractedRelationship
} from "../types.js";

export class PolyglotParser implements ILanguageParser {
  parse(filePath: string, content: string): AnalysisResult {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === ".sql") {
      return this.parseSql(filePath, content);
    }
    if (ext === ".md") {
      return this.parseMarkdown(filePath, content);
    }
    if (ext === ".json" || ext === ".yaml" || ext === ".yml") {
      return this.parseConfig(filePath, content);
    }

    return this.parseCStyleLanguage(filePath, content, ext);
  }

  /**
   * Universal C-style parser for Java, Kotlin, C, C++, C#, PHP, Ruby.
   */
  private parseCStyleLanguage(filePath: string, content: string, ext: string): AnalysisResult {
    const lines = content.split("\n");
    const symbols: ExtractedSymbol[] = [];
    const imports: ExtractedImport[] = [];
    const exports: ExtractedExport[] = [];
    const relationships: ExtractedRelationship[] = [];

    let currentDocComment: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const rawLine = lines[i];
      const trimmed = rawLine.trim();

      // Collect doc comments
      if (trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("*")) {
        currentDocComment.push(trimmed.replace(/^(\/\/|#|\*+)\s*/, ""));
        continue;
      }

      if (!trimmed) {
        currentDocComment = [];
        continue;
      }

      // 1. Imports / Includes / Usings / Requires
      const importMatch =
        trimmed.match(/^(?:import|using|#include|package|require|use)\s+([<"']?)([a-zA-Z0-9_.*:\/\\]+)\1/) ||
        trimmed.match(/^from\s+([a-zA-Z0-9_.]+)\s+import/);

      if (importMatch) {
        const specifier = importMatch[2] || importMatch[1];
        const name = specifier.split(/[./:\\]/).pop() || specifier;

        imports.push({
          moduleSpecifier: specifier,
          namedImports: [{ name, isTypeOnly: false }],
          startLine: lineNum,
          endLine: lineNum
        });

        relationships.push({
          sourceName: filePath,
          targetName: name,
          type: "IMPORTS",
          startLine: lineNum
        });
        currentDocComment = [];
        continue;
      }

      // 2. Class / Struct / Interface / Trait declarations
      const classMatch = trimmed.match(
        /^(?:(?:public|private|protected|static|final|abstract|class|struct|interface|enum|module)\s+)*(class|struct|interface|enum|record|module)\s+([A-Za-z0-9_]+)/
      );
      if (classMatch) {
        const kind = classMatch[1] === "interface" ? "interface" : classMatch[1] === "enum" ? "enum" : "class";
        const name = classMatch[2];
        const endLine = this.findBraceBlockEnd(lines, i);
        const isExported = trimmed.includes("public") || ext === ".rb" || ext === ".py";

        symbols.push({
          name,
          kind: kind as any,
          filePath,
          startLine: lineNum,
          endLine,
          signature: trimmed.split("{")[0].trim(),
          docComment: currentDocComment.length > 0 ? currentDocComment.join(" ") : undefined,
          isExported
        });

        if (isExported) {
          exports.push({
            name,
            isDefault: false,
            startLine: lineNum,
            endLine: lineNum
          });
        }

        relationships.push({
          sourceName: name,
          type: "DEFINES",
          startLine: lineNum
        });

        currentDocComment = [];
        continue;
      }

      // 3. Methods & Functions: [public/void/int/def/func] name(...)
      const funcMatch =
        trimmed.match(/^(?:(?:public|private|protected|static|final|async|fun|def|function)\s+)*(?:[A-Za-z0-9_<>[\]]+[*&]?\s+)?([A-Za-z0-9_]+)\s*\((.*?)\)\s*(?:const|noexcept|throws.*?)?\s*[{;]?$/);

      if (
        funcMatch &&
        !trimmed.startsWith("if") &&
        !trimmed.startsWith("while") &&
        !trimmed.startsWith("for") &&
        !trimmed.startsWith("switch") &&
        !trimmed.startsWith("catch") &&
        !trimmed.startsWith("return") &&
        funcMatch[1] !== "main" &&
        funcMatch[1].length > 2
      ) {
        const funcName = funcMatch[1];
        const endLine = this.findBraceBlockEnd(lines, i);
        const isExported = trimmed.includes("public") || ext === ".rb" || ext === ".php";

        symbols.push({
          name: funcName,
          kind: "function",
          filePath,
          startLine: lineNum,
          endLine,
          signature: trimmed.split("{")[0].trim(),
          docComment: currentDocComment.length > 0 ? currentDocComment.join(" ") : undefined,
          isExported
        });

        relationships.push({
          sourceName: funcName,
          type: "DEFINES",
          startLine: lineNum
        });

        currentDocComment = [];
        continue;
      }

      currentDocComment = [];
    }

    return { symbols, imports, exports, relationships };
  }

  private parseSql(filePath: string, content: string): AnalysisResult {
    const lines = content.split("\n");
    const symbols: ExtractedSymbol[] = [];
    const relationships: ExtractedRelationship[] = [];

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const trimmed = lines[i].trim();

      const tableMatch = trimmed.match(/^CREATE\s+(?:OR\s+REPLACE\s+)?(TABLE|VIEW|PROCEDURE|FUNCTION)\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`|\[|"|')?([A-Za-z0-9_.]+)/i);
      if (tableMatch) {
        const kind = tableMatch[1].toUpperCase() === "TABLE" ? "class" : "function";
        const name = tableMatch[2].replace(/[`"']/g, "");
        let endLine = lineNum;

        for (let j = i; j < lines.length; j++) {
          if (lines[j].includes(";")) {
            endLine = j + 1;
            break;
          }
        }

        symbols.push({
          name,
          kind: kind as any,
          filePath,
          startLine: lineNum,
          endLine,
          signature: trimmed,
          isExported: true
        });

        relationships.push({
          sourceName: name,
          type: "DEFINES",
          startLine: lineNum
        });
      }
    }

    return { symbols, imports: [], exports: [], relationships };
  }

  private parseMarkdown(filePath: string, content: string): AnalysisResult {
    const lines = content.split("\n");
    const symbols: ExtractedSymbol[] = [];

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const trimmed = lines[i].trim();

      const headerMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
      if (headerMatch) {
        const title = headerMatch[2].trim();
        symbols.push({
          name: title,
          kind: "class",
          filePath,
          startLine: lineNum,
          endLine: Math.min(lineNum + 15, lines.length),
          signature: trimmed,
          isExported: true
        });
      }
    }

    return { symbols, imports: [], exports: [], relationships: [] };
  }

  private parseConfig(filePath: string, content: string): AnalysisResult {
    const fileName = path.basename(filePath);
    const lines = content.split("\n");

    const symbols: ExtractedSymbol[] = [
      {
        name: fileName,
        kind: "class",
        filePath,
        startLine: 1,
        endLine: lines.length,
        signature: `${fileName} (Configuration)`,
        isExported: true
      }
    ];

    return { symbols, imports: [], exports: [], relationships: [] };
  }

  private findBraceBlockEnd(lines: string[], startIdx: number): number {
    let braceCount = 0;
    let foundOpen = false;

    for (let j = startIdx; j < lines.length; j++) {
      const line = lines[j];
      for (const char of line) {
        if (char === "{") {
          braceCount++;
          foundOpen = true;
        } else if (char === "}") {
          braceCount--;
          if (foundOpen && braceCount <= 0) {
            return j + 1;
          }
        }
      }
      if (line.trim().endsWith(";") && !foundOpen) {
        return j + 1;
      }
    }
    return Math.min(startIdx + 20, lines.length);
  }
}
