import { type SourceFile } from "ts-morph";
import {
  type ExtractedImport,
  type ExtractedExport,
  type ImportedSymbol
} from "./types.js";

export class ImportExportExtractor {
  static extractImports(sourceFile: SourceFile): ExtractedImport[] {
    const imports: ExtractedImport[] = [];

    for (const importDecl of sourceFile.getImportDeclarations()) {
      const sourceModule = importDecl.getModuleSpecifierValue();
      const importedSymbols: ImportedSymbol[] = [];

      // 1. Default import: import foo from 'bar'
      const defaultImport = importDecl.getDefaultImport();
      if (defaultImport) {
        importedSymbols.push({
          name: defaultImport.getText(),
          isDefault: true,
          isNamespace: false
        });
      }

      // 2. Namespace import: import * as foo from 'bar'
      const namespaceImport = importDecl.getNamespaceImport();
      if (namespaceImport) {
        importedSymbols.push({
          name: namespaceImport.getText(),
          isDefault: false,
          isNamespace: true
        });
      }

      // 3. Named imports: import { a, b as c } from 'bar'
      for (const namedImport of importDecl.getNamedImports()) {
        const name = namedImport.getName();
        const aliasNode = namedImport.getAliasNode();
        const alias = aliasNode ? aliasNode.getText() : undefined;

        importedSymbols.push({
          name,
          alias,
          isDefault: false,
          isNamespace: false
        });
      }

      imports.push({
        sourceModule,
        importedSymbols,
        startLine: importDecl.getStartLineNumber(),
        endLine: importDecl.getEndLineNumber()
      });
    }

    return imports;
  }

  static extractExports(sourceFile: SourceFile): ExtractedExport[] {
    const exports: ExtractedExport[] = [];

    // 1. Export Declarations: export { a, b } or export * from './foo'
    for (const exportDecl of sourceFile.getExportDeclarations()) {
      const sourceModule = exportDecl.getModuleSpecifierValue();
      const isNamespaceExport = exportDecl.isNamespaceExport();

      if (isNamespaceExport || exportDecl.getNamedExports().length === 0 && sourceModule) {
        exports.push({
          name: "*",
          exportType: "all",
          sourceModule,
          startLine: exportDecl.getStartLineNumber(),
          endLine: exportDecl.getEndLineNumber()
        });
      } else {
        for (const namedExport of exportDecl.getNamedExports()) {
          exports.push({
            name: namedExport.getName(),
            exportType: "named",
            sourceModule,
            startLine: exportDecl.getStartLineNumber(),
            endLine: exportDecl.getEndLineNumber()
          });
        }
      }
    }

    // 2. Exported Declarations (e.g. export function foo() {}, export class Bar {})
    for (const [name, declarations] of sourceFile.getExportedDeclarations()) {
      for (const decl of declarations) {
        const isDefault = name === "default";
        exports.push({
          name,
          exportType: isDefault ? "default" : "named",
          startLine: decl.getStartLineNumber(),
          endLine: decl.getEndLineNumber()
        });
      }
    }

    // Deduplicate exports by name and startLine
    const uniqueMap = new Map<string, ExtractedExport>();
    for (const exp of exports) {
      const key = `${exp.name}:${exp.startLine}:${exp.exportType}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, exp);
      }
    }

    return Array.from(uniqueMap.values());
  }
}
