import fs from "node:fs";
import path from "node:path";
import { Project, ScriptTarget, ts, type SourceFile } from "ts-morph";
import { SymbolExtractor } from "./symbol-extractor.js";
import { ImportExportExtractor } from "./import-extractor.js";
import { RelationshipResolver } from "./relationship-resolver.js";
import { type FileAnalysisResult } from "./types.js";
import { Logger } from "../../utils/logger.js";

export class AstParser {
  private readonly project: Project;
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = path.resolve(projectRoot);
    this.project = new Project({
      compilerOptions: {
        allowJs: true,
        jsx: ts.JsxEmit.ReactJSX,
        target: ScriptTarget.ESNext,
        skipLibCheck: true
      },
      skipAddingFilesFromTsConfig: true,
      skipFileDependencyResolution: true,
      useInMemoryFileSystem: true
    });
  }

  /**
   * Parses a single file by relative path and extracts symbols, imports, exports, and relationships.
   */
  parseSourceFile(relativePath: string, fileContent?: string): FileAnalysisResult {
    const fullPath = path.isAbsolute(relativePath)
      ? relativePath
      : path.join(this.projectRoot, relativePath);

    const content = fileContent !== undefined ? fileContent : fs.readFileSync(fullPath, "utf8");

    try {
      // Create or update in-memory source file to avoid file lock issues and conserve memory
      let sourceFile = this.project.getSourceFile(fullPath);
      if (sourceFile) {
        sourceFile.replaceWithText(content);
      } else {
        sourceFile = this.project.createSourceFile(fullPath, content, { overwrite: true });
      }

      const symbols = SymbolExtractor.extract(sourceFile, relativePath);
      const imports = ImportExportExtractor.extractImports(sourceFile);
      const exports = ImportExportExtractor.extractExports(sourceFile);
      const relationships = RelationshipResolver.resolve(
        sourceFile,
        relativePath,
        symbols,
        imports,
        exports
      );

      // Free source file from project memory
      this.project.removeSourceFile(sourceFile);

      return {
        filePath: relativePath,
        symbols,
        imports,
        exports,
        relationships
      };
    } catch (err: any) {
      Logger.debug("ast-parser", `Failed to parse ${relativePath}: ${err.message}`);
      return {
        filePath: relativePath,
        symbols: [],
        imports: [],
        exports: [],
        relationships: []
      };
    }
  }

  /**
   * Batch parses multiple scanned files.
   */
  parseFiles(files: { relativePath: string; absolutePath: string }[]): FileAnalysisResult[] {
    const results: FileAnalysisResult[] = [];
    for (const file of files) {
      const res = this.parseSourceFile(file.relativePath);
      results.push(res);
    }
    return results;
  }
}
