import { type ILanguageParser } from "./base-parser.js";
import {
  type AnalysisResult,
  type ExtractedSymbol,
  type ExtractedImport,
  type ExtractedExport,
  type ExtractedRelationship
} from "../types.js";

export class RustParser implements ILanguageParser {
  parse(filePath: string, content: string): AnalysisResult {
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

      // Collect doc comments /// or //
      if (trimmed.startsWith("///") || trimmed.startsWith("//")) {
        currentDocComment.push(trimmed.replace(/^\/\/\/?\s*/, ""));
        continue;
      }

      if (!trimmed || trimmed.startsWith("#[")) {
        continue;
      }

      // 1. Rust use statements: use std::collections::HashMap;
      const useMatch = trimmed.match(/^pub\s+use\s+(.+?);|^use\s+(.+?);/);
      if (useMatch) {
        const usePath = (useMatch[1] || useMatch[2]).trim();
        const itemName = usePath.split("::").pop() || usePath;
        imports.push({
          moduleSpecifier: usePath,
          namedImports: [{ name: itemName, isTypeOnly: false }],
          startLine: lineNum,
          endLine: lineNum
        });
        relationships.push({
          sourceName: filePath,
          targetName: itemName,
          type: "IMPORTS",
          startLine: lineNum
        });
        currentDocComment = [];
        continue;
      }

      // 2. Rust Structs & Enums & Traits
      const typeMatch = trimmed.match(/^(?:pub(?:\(.*?\))?\s+)?(struct|enum|trait)\s+([A-Za-z0-9_]+)/);
      if (typeMatch) {
        const kind = typeMatch[1] as "class" | "enum" | "interface";
        const typeName = typeMatch[2];
        const isExported = trimmed.startsWith("pub");
        const endLine = this.findBraceBlockEnd(lines, i);

        symbols.push({
          name: typeName,
          kind: kind === "struct" ? "class" : kind === "trait" ? "interface" : "enum",
          filePath,
          startLine: lineNum,
          endLine,
          signature: trimmed.split("{")[0].trim(),
          docComment: currentDocComment.length > 0 ? currentDocComment.join(" ") : undefined,
          isExported
        });

        if (isExported) {
          exports.push({
            name: typeName,
            isDefault: false,
            startLine: lineNum,
            endLine: lineNum
          });
        }

        relationships.push({
          sourceName: typeName,
          type: "DEFINES",
          startLine: lineNum
        });

        currentDocComment = [];
        continue;
      }

      // 3. Rust impl blocks: impl StructName or impl Trait for StructName
      const implMatch = trimmed.match(/^impl(?:\s*<.*?>)?\s+(?:([A-Za-z0-9_]+)\s+for\s+)?([A-Za-z0-9_]+)/);
      if (implMatch) {
        const traitName = implMatch[1];
        const targetType = implMatch[2];
        const endLine = this.findBraceBlockEnd(lines, i);

        if (traitName) {
          relationships.push({
            sourceName: targetType,
            targetName: traitName,
            type: "USES",
            startLine: lineNum
          });
        }

        currentDocComment = [];
        continue;
      }

      // 4. Rust functions: pub fn function_name(...) or fn function_name(...)
      const fnMatch = trimmed.match(/^(?:pub(?:\(.*?\))?\s+)?(?:async\s+)?fn\s+([A-Za-z0-9_]+)\s*(?:<.*?>)?\s*\((.*?)\)(.*)/);
      if (fnMatch) {
        const fnName = fnMatch[1];
        const isExported = trimmed.startsWith("pub");
        const endLine = this.findBraceBlockEnd(lines, i);

        symbols.push({
          name: fnName,
          kind: "function",
          filePath,
          startLine: lineNum,
          endLine,
          signature: trimmed.split("{")[0].trim(),
          docComment: currentDocComment.length > 0 ? currentDocComment.join(" ") : undefined,
          isExported
        });

        if (isExported) {
          exports.push({
            name: fnName,
            isDefault: false,
            startLine: lineNum,
            endLine: lineNum
          });
        }

        relationships.push({
          sourceName: fnName,
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
    return lines.length;
  }
}
