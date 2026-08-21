import { type ILanguageParser } from "./base-parser.js";
import {
  type AnalysisResult,
  type ExtractedSymbol,
  type ExtractedImport,
  type ExtractedExport,
  type ExtractedRelationship
} from "../types.js";

export class GoParser implements ILanguageParser {
  parse(filePath: string, content: string): AnalysisResult {
    const lines = content.split("\n");
    const symbols: ExtractedSymbol[] = [];
    const imports: ExtractedImport[] = [];
    const exports: ExtractedExport[] = [];
    const relationships: ExtractedRelationship[] = [];

    let inMultiImport = false;
    let currentDocComment: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const rawLine = lines[i];
      const trimmed = rawLine.trim();

      // Collect doc comments
      if (trimmed.startsWith("//")) {
        currentDocComment.push(trimmed.replace(/^\/\/\s*/, ""));
        continue;
      }

      if (!trimmed) {
        currentDocComment = [];
        continue;
      }

      // 1. Multi-line import block
      if (trimmed.startsWith("import (")) {
        inMultiImport = true;
        continue;
      }
      if (inMultiImport) {
        if (trimmed.startsWith(")")) {
          inMultiImport = false;
          continue;
        }
        const pkgMatch = trimmed.match(/(?:([a-zA-Z0-9_]+)\s+)?"([^"]+)"/);
        if (pkgMatch) {
          const alias = pkgMatch[1];
          const pkgPath = pkgMatch[2];
          const name = alias || pkgPath.split("/").pop() || pkgPath;
          imports.push({
            moduleSpecifier: pkgPath,
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
        }
        continue;
      }

      // 2. Single import
      const singleImportMatch = trimmed.match(/^import\s+(?:([a-zA-Z0-9_]+)\s+)?"([^"]+)"/);
      if (singleImportMatch) {
        const alias = singleImportMatch[1];
        const pkgPath = singleImportMatch[2];
        const name = alias || pkgPath.split("/").pop() || pkgPath;
        imports.push({
          moduleSpecifier: pkgPath,
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

      // 3. Structs & Interfaces: type StructName struct / type InterfaceName interface
      const typeMatch = trimmed.match(/^type\s+([A-Za-z0-9_]+)\s+(struct|interface)/);
      if (typeMatch) {
        const typeName = typeMatch[1];
        const kind = typeMatch[2] === "struct" ? "class" : "interface";
        const endLine = this.findBraceBlockEnd(lines, i);
        const isExported = typeName[0] === typeName[0].toUpperCase();

        symbols.push({
          name: typeName,
          kind: kind as any,
          filePath,
          startLine: lineNum,
          endLine,
          signature: `type ${typeName} ${typeMatch[2]}`,
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

      // 4. Methods with receiver: func (r *Receiver) MethodName(...) ...
      const methodMatch = trimmed.match(/^func\s*\(\s*(?:[a-zA-Z0-9_]+\s+)?\*?([a-zA-Z0-9_]+)\s*\)\s*([A-Za-z0-9_]+)\s*\((.*?)\)(.*)/);
      if (methodMatch) {
        const receiverType = methodMatch[1];
        const methodName = methodMatch[2];
        const fullName = `${receiverType}.${methodName}`;
        const endLine = this.findBraceBlockEnd(lines, i);
        const isExported = methodName[0] === methodName[0].toUpperCase();

        symbols.push({
          name: fullName,
          kind: "method",
          filePath,
          startLine: lineNum,
          endLine,
          signature: trimmed.split("{")[0].trim(),
          docComment: currentDocComment.length > 0 ? currentDocComment.join(" ") : undefined,
          isExported
        });

        relationships.push({
          sourceName: fullName,
          type: "DEFINES",
          startLine: lineNum
        });

        const bodyLines = lines.slice(i, endLine);
        this.extractCallsInLines(bodyLines, fullName, lineNum, relationships);

        currentDocComment = [];
        continue;
      }

      // 5. Standard functions: func FuncName(...) ...
      const funcMatch = trimmed.match(/^func\s+([A-Za-z0-9_]+)\s*\((.*?)\)(.*)/);
      if (funcMatch) {
        const funcName = funcMatch[1];
        const endLine = this.findBraceBlockEnd(lines, i);
        const isExported = funcName[0] === funcName[0].toUpperCase();

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

        if (isExported) {
          exports.push({
            name: funcName,
            isDefault: false,
            startLine: lineNum,
            endLine: lineNum
          });
        }

        relationships.push({
          sourceName: funcName,
          type: "DEFINES",
          startLine: lineNum
        });

        const bodyLines = lines.slice(i, endLine);
        this.extractCallsInLines(bodyLines, funcName, lineNum, relationships);

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
    }
    return lines.length;
  }

  private extractCallsInLines(
    lines: string[],
    callerName: string,
    startLine: number,
    relationships: ExtractedRelationship[]
  ): void {
    const seen = new Set<string>();
    for (let k = 0; k < lines.length; k++) {
      const l = lines[k].trim();
      const callRegex = /([a-zA-Z0-9_.]+)\s*\(/g;
      let match;
      while ((match = callRegex.exec(l)) !== null) {
        const callee = match[1];
        if (
          !callee.startsWith("func") &&
          !callee.startsWith("type") &&
          callee !== callerName &&
          callee !== "make" &&
          callee !== "new" &&
          callee !== "len" &&
          callee !== "append" &&
          callee !== "panic" &&
          !seen.has(callee)
        ) {
          seen.add(callee);
          relationships.push({
            sourceName: callerName,
            targetName: callee,
            type: "CALLS",
            startLine: startLine + k
          });
        }
      }
    }
  }
}
