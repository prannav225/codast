import {
  type SourceFile,
  SyntaxKind,
  Node,
  type CallExpression,
  type Identifier
} from "ts-morph";
import {
  type ExtractedSymbol,
  type ExtractedImport,
  type ExtractedExport,
  type ExtractedRelationship
} from "./types.js";

export class RelationshipResolver {
  static resolve(
    sourceFile: SourceFile,
    relativePath: string,
    symbols: ExtractedSymbol[],
    imports: ExtractedImport[],
    exports: ExtractedExport[]
  ): ExtractedRelationship[] {
    const relationships: ExtractedRelationship[] = [];

    // 1. IMPORTS relationships (file -> module/file)
    for (const imp of imports) {
      for (const sym of imp.importedSymbols) {
        relationships.push({
          sourceFilePath: relativePath,
          targetModule: imp.sourceModule,
          targetSymbolName: sym.name,
          type: "IMPORTS",
          line: imp.startLine
        });
      }
    }

    // 2. EXPORTS relationships (file -> symbol)
    for (const exp of exports) {
      relationships.push({
        sourceFilePath: relativePath,
        sourceSymbolName: exp.name,
        targetModule: exp.sourceModule,
        type: "EXPORTS",
        line: exp.startLine
      });
    }

    // 3. DEFINES relationships (file -> defined symbols)
    for (const sym of symbols) {
      relationships.push({
        sourceFilePath: relativePath,
        sourceSymbolName: sym.name,
        type: "DEFINES",
        line: sym.startLine
      });
    }

    // Map symbols to their AST nodes to find inner function calls (CALLS / USES)
    const importedSymbolNames = new Map<string, string>(); // importedName -> sourceModule
    for (const imp of imports) {
      for (const sym of imp.importedSymbols) {
        const localName = sym.alias || sym.name;
        importedSymbolNames.set(localName, imp.sourceModule);
      }
    }

    // 4. CALLS and USES relationships (symbol -> called symbol or hook)
    const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    for (const call of callExpressions) {
      const expr = call.getExpression();
      const callText = expr.getText();
      const callLine = call.getStartLineNumber();

      // Find enclosing symbol
      const enclosingSymbol = this.findEnclosingSymbol(symbols, callLine);

      // Check if it's calling a custom hook: USES
      if (/^use[A-Z0-9]/.test(callText)) {
        relationships.push({
          sourceFilePath: relativePath,
          sourceSymbolName: enclosingSymbol?.name,
          targetSymbolName: callText,
          targetModule: importedSymbolNames.get(callText),
          type: "USES",
          line: callLine
        });
      } else {
        // Standard function/method call: CALLS
        let targetSymbol = callText;
        if (callText.includes(".")) {
          // e.g. authService.login -> targetSymbol: authService.login
          const parts = callText.split(".");
          const baseName = parts[0];
          relationships.push({
            sourceFilePath: relativePath,
            sourceSymbolName: enclosingSymbol?.name,
            targetSymbolName: callText,
            targetModule: importedSymbolNames.get(baseName),
            type: "CALLS",
            line: callLine
          });
        } else if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(callText)) {
          // Simple identifier call e.g. loginUser()
          relationships.push({
            sourceFilePath: relativePath,
            sourceSymbolName: enclosingSymbol?.name,
            targetSymbolName: callText,
            targetModule: importedSymbolNames.get(callText),
            type: "CALLS",
            line: callLine
          });
        }
      }
    }

    // Deduplicate relationships
    const uniqueMap = new Map<string, ExtractedRelationship>();
    for (const rel of relationships) {
      const key = `${rel.sourceFilePath}|${rel.sourceSymbolName || ""}|${rel.targetFilePath || ""}|${rel.targetSymbolName || ""}|${rel.targetModule || ""}|${rel.type}|${rel.line}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, rel);
      }
    }

    return Array.from(uniqueMap.values());
  }

  private static findEnclosingSymbol(symbols: ExtractedSymbol[], line: number): ExtractedSymbol | undefined {
    // Find smallest symbol enclosing the line
    let closest: ExtractedSymbol | undefined;
    let minSpan = Infinity;

    for (const sym of symbols) {
      if (line >= sym.startLine && line <= sym.endLine) {
        const span = sym.endLine - sym.startLine;
        if (span < minSpan) {
          minSpan = span;
          closest = sym;
        }
      }
    }

    return closest;
  }
}
