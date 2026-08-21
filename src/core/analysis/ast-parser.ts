import fs from "node:fs";
import path from "node:path";
import { Project, ScriptTarget, ts } from "ts-morph";
import { SymbolExtractor } from "./symbol-extractor.js";
import { ImportExportExtractor } from "./import-extractor.js";
import { RelationshipResolver } from "./relationship-resolver.js";
import { PythonParser } from "./parsers/python-parser.js";
import { GoParser } from "./parsers/go-parser.js";
import { RustParser } from "./parsers/rust-parser.js";
import { PolyglotParser } from "./parsers/polyglot-parser.js";
import { type FileAnalysisResult } from "./types.js";
import { Logger } from "../../utils/logger.js";

export class AstParser {
  private readonly project: Project;
  private readonly projectRoot: string;
  private readonly pythonParser: PythonParser;
  private readonly goParser: GoParser;
  private readonly rustParser: RustParser;
  private readonly polyglotParser: PolyglotParser;

  constructor(projectRoot: string) {
    this.projectRoot = path.resolve(projectRoot);
    this.pythonParser = new PythonParser();
    this.goParser = new GoParser();
    this.rustParser = new RustParser();
    this.polyglotParser = new PolyglotParser();

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
   * Parses any supported source file (JS/TS, Python, Go, Rust, Java, C++, SQL, Markdown, Config)
   * and extracts structured symbols, imports, exports, and relationships.
   */
  parseSourceFile(relativePath: string, fileContent?: string): FileAnalysisResult {
    const fullPath = path.isAbsolute(relativePath)
      ? relativePath
      : path.join(this.projectRoot, relativePath);

    const content = fileContent !== undefined ? fileContent : fs.readFileSync(fullPath, "utf8");
    const ext = path.extname(relativePath).toLowerCase();

    // 1. Python Parser
    if (ext === ".py" || ext === ".pyi") {
      const res = this.pythonParser.parse(relativePath, content);
      return { filePath: relativePath, ...res };
    }

    // 2. Go Parser
    if (ext === ".go") {
      const res = this.goParser.parse(relativePath, content);
      return { filePath: relativePath, ...res };
    }

    // 3. Rust Parser
    if (ext === ".rs") {
      const res = this.rustParser.parse(relativePath, content);
      return { filePath: relativePath, ...res };
    }

    // 4. JavaScript & TypeScript AST Parser (ts-morph)
    if (
      ext === ".ts" ||
      ext === ".tsx" ||
      ext === ".js" ||
      ext === ".jsx" ||
      ext === ".mjs" ||
      ext === ".cjs"
    ) {
      return this.parseTypeScriptSource(relativePath, fullPath, content);
    }

    // 5. Universal Polyglot Parser (Java, Kotlin, C/C++, C#, PHP, Ruby, SQL, MD, Configs)
    const polyglotRes = this.polyglotParser.parse(relativePath, content);
    return { filePath: relativePath, ...polyglotRes };
  }

  private parseTypeScriptSource(relativePath: string, fullPath: string, content: string): FileAnalysisResult {
    try {
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
