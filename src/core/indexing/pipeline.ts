import fs from "node:fs";
import path from "node:path";
import { ConfigManager } from "../../config/config-manager.js";
import { RepositoryScanner, type ScannedFile } from "../scanner/scanner.js";
import { AstParser } from "../analysis/ast-parser.js";
import { LogicalChunker, type LogicalChunk } from "../analysis/chunker.js";
import { SqliteDatabase } from "../../storage/sqlite/db.js";
import { SqliteRepositoryManager, type ChunkRecord } from "../../storage/sqlite/repositories.js";
import { LanceVectorStore, type VectorRecord } from "../../storage/vector/lance-store.js";
import { createEmbeddingProvider } from "../ai/ai-service.js";
import { computeHash } from "../../utils/hash.js";
import { Logger } from "../../utils/logger.js";

export interface IndexingOptions {
  force?: boolean;
  verbose?: boolean;
  onProgress?: (stage: string, detail?: string) => void;
}

export interface IndexingResult {
  totalFiles: number;
  parsedFiles: number;
  skippedFiles: number;
  totalSymbols: number;
  totalRelationships: number;
  totalChunks: number;
  embeddedChunks: number;
  durationMs: number;
}

export class IndexingPipeline {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = path.resolve(projectRoot);
  }

  async run(options: IndexingOptions = {}): Promise<IndexingResult> {
    const startTime = Date.now();
    const notify = (stage: string, detail?: string) => {
      if (options.onProgress) {
        options.onProgress(stage, detail);
      }
      Logger.debug("indexer", `${stage}${detail ? ` (${detail})` : ""}`);
    };

    // 1. Config & Embedding Provider verification (Voyage AI, Gemini, or Ollama)
    const config = ConfigManager.loadConfig(this.projectRoot);
    const embeddingProvider = createEmbeddingProvider(this.projectRoot);

    // 2. Discover and filter repository files
    notify("Discovering files", "Scanning source tree");
    const scanner = new RepositoryScanner(this.projectRoot, config.exclude);
    const scanResult = await scanner.scan();

    if (scanResult.totalFiles === 0) {
      Logger.warn("No supported source files discovered.");
    }

    // 3. Initialize SQLite & Vector Storage
    notify("Initializing local storage", "SQLite and LanceDB");
    const dbPath = ConfigManager.getMetadataDbPath(this.projectRoot);
    const vectorsDir = ConfigManager.getVectorsDirPath(this.projectRoot);

    const db = SqliteDatabase.get(dbPath);
    const repoManager = new SqliteRepositoryManager(db);
    const projectName = path.basename(this.projectRoot);
    const repo = repoManager.getOrCreateRepository(this.projectRoot, projectName);

    const vectorStore = new LanceVectorStore(vectorsDir);
    await vectorStore.initialize();

    const isPreviouslyIndexed = repo.status === "INDEXED";

    if (options.force || !isPreviouslyIndexed) {
      notify("Preparing index", options.force ? "Force re-index requested" : "Clean indexing requested");
      repoManager.clearRepositoryData(repo.id);
      await vectorStore.clear();
    }

    // Map existing files and chunks
    const existingFiles = repoManager.getAllFiles(repo.id);
    const existingFileHashMap = new Map<string, string>();
    for (const f of existingFiles) {
      existingFileHashMap.set(f.path, f.content_hash);
    }

    const existingChunks = repoManager.getAllChunks(repo.id);
    const existingChunkHashes = new Set<string>(existingChunks.map(c => c.content_hash));

    // 4. AST Analysis & Structured Indexing (saved directly into SQLite)
    notify("Analyzing AST & Extracting symbols", `${scanResult.totalFiles} files`);
    const parser = new AstParser(this.projectRoot);

    let parsedFilesCount = 0;
    let skippedFilesCount = 0;
    let totalSymbolsCount = 0;
    let totalRelationshipsCount = 0;

    const allNewChunks: Array<{ fileId: number; chunk: LogicalChunk }> = [];

    for (let i = 0; i < scanResult.files.length; i++) {
      const file = scanResult.files[i];
      const isUnchanged =
        !options.force &&
        isPreviouslyIndexed &&
        existingFileHashMap.get(file.relativePath) === file.contentHash;

      if (isUnchanged) {
        skippedFilesCount++;
        continue;
      }

      notify("Parsing file", `[${i + 1}/${scanResult.files.length}] ${file.relativePath}`);

      try {
        const fileContent = fs.readFileSync(file.absolutePath, "utf8");
        const fileId = repoManager.saveFile(repo.id, file);

        // AST Parse
        const analysis = parser.parseSourceFile(file.relativePath, fileContent);

        // Save Symbols
        repoManager.saveSymbols(fileId, analysis.symbols);
        totalSymbolsCount += analysis.symbols.length;

        // Save Relationships
        repoManager.saveRelationships(repo.id, fileId, analysis.relationships);
        totalRelationshipsCount += analysis.relationships.length;

        // Create Logical Chunks
        const chunks = LogicalChunker.chunkFile(file.relativePath, fileContent, analysis.symbols);
        
        // Immediately persist chunks to SQLite
        const sqliteChunkRecords: ChunkRecord[] = chunks.map(chunk => ({
          id: chunk.id,
          file_id: fileId,
          symbol_id: chunk.symbolId,
          name: chunk.name,
          chunk_type: chunk.chunkType,
          start_line: chunk.startLine,
          end_line: chunk.endLine,
          content: chunk.content,
          content_hash: chunk.contentHash
        }));

        repoManager.saveChunks(fileId, sqliteChunkRecords);

        for (const chunk of chunks) {
          allNewChunks.push({ fileId, chunk });
        }

        parsedFilesCount++;
      } catch (err: any) {
        Logger.debug("indexer", `Failed to index file ${file.relativePath}: ${err.message}`);
        skippedFilesCount++;
      }
    }

    // 5. Generate Vector Embeddings
    const chunksNeedingEmbedding = allNewChunks.filter(
      item => !existingChunkHashes.has(item.chunk.contentHash)
    );

    let embeddedChunksCount = 0;

    if (chunksNeedingEmbedding.length > 0) {
      notify("Generating embeddings", `0/${chunksNeedingEmbedding.length} chunks via ${config.embeddingProvider || "Voyage AI"}`);

      const batchSize = 80;
      const totalToEmbed = chunksNeedingEmbedding.length;

      try {
        for (let i = 0; i < totalToEmbed; i += batchSize) {
          const batchItems = chunksNeedingEmbedding.slice(i, i + batchSize);
          const batchTexts = batchItems.map(c => c.chunk.enrichedContent);

          notify(
            "Generating embeddings",
            `[${i + 1}-${Math.min(i + batchSize, totalToEmbed)}/${totalToEmbed}] chunks`
          );

          const embeddings = await embeddingProvider.generateEmbeddings(batchTexts, batchSize, (comp, tot, statusMsg) => {
            if (statusMsg) {
              notify("Generating embeddings", `[${i + comp}/${totalToEmbed}] ${statusMsg}`);
            }
          });

          // Store vector records into LanceDB
          const vectorRecords: VectorRecord[] = batchItems.map((item, idx) => ({
            id: item.chunk.id,
            vector: embeddings[idx],
            filePath: item.chunk.filePath,
            symbolName: item.chunk.name,
            chunkType: item.chunk.chunkType,
            startLine: item.chunk.startLine,
            endLine: item.chunk.endLine,
            content: item.chunk.content,
            contentHash: item.chunk.contentHash
          }));

          await vectorStore.upsertChunks(vectorRecords);
          embeddedChunksCount += batchItems.length;

          if (i + batchSize < totalToEmbed) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      } catch (embedError: any) {
        Logger.warn(`\nEmbedding generation paused: ${embedError.message}`);
        Logger.info("Code structure, AST symbols, and relationships are safely saved in SQLite. Queries will use structural search.");
      }
    }

    // 6. Finalize & Mark Indexed
    const finalStats = repoManager.getProjectStats(repo.id);
    repoManager.updateRepositoryStatus(repo.id, "INDEXED");

    const durationMs = Date.now() - startTime;
    notify("Indexing complete", `Finished in ${(durationMs / 1000).toFixed(2)}s`);

    return {
      totalFiles: scanResult.totalFiles,
      parsedFiles: parsedFilesCount,
      skippedFiles: skippedFilesCount,
      totalSymbols: finalStats.symbolCount,
      totalRelationships: finalStats.relationshipCount,
      totalChunks: finalStats.chunkCount,
      embeddedChunks: embeddedChunksCount,
      durationMs
    };
  }

  /**
   * Fast incremental re-indexing for a single modified or created file.
   */
  async indexSingleFile(relativePath: string): Promise<{ symbolCount: number; chunkCount: number }> {
    const absPath = path.isAbsolute(relativePath) ? relativePath : path.join(this.projectRoot, relativePath);
    const rel = path.relative(this.projectRoot, absPath);

    if (!fs.existsSync(absPath)) {
      throw new Error(`File does not exist: ${absPath}`);
    }

    const content = fs.readFileSync(absPath, "utf8");
    const lines = content.split("\n").length;
    const bytes = Buffer.byteLength(content, "utf8");
    const contentHash = computeHash(content);

    const dbPath = ConfigManager.getMetadataDbPath(this.projectRoot);
    const vectorsDir = ConfigManager.getVectorsDirPath(this.projectRoot);
    const db = SqliteDatabase.get(dbPath);
    const repoManager = new SqliteRepositoryManager(db);
    const projectName = path.basename(this.projectRoot);
    const repo = repoManager.getOrCreateRepository(this.projectRoot, projectName);

    const scannedFile: ScannedFile = {
      absolutePath: absPath,
      relativePath: rel,
      extension: path.extname(absPath),
      sizeBytes: bytes,
      lineCount: lines,
      contentHash
    };

    const fileId = repoManager.saveFile(repo.id, scannedFile);
    const parser = new AstParser(this.projectRoot);
    const analysis = parser.parseSourceFile(rel, content);

    // Save Symbols & Relationships
    repoManager.saveSymbols(fileId, analysis.symbols);
    repoManager.saveRelationships(repo.id, fileId, analysis.relationships);

    // Generate Chunks
    const chunks = LogicalChunker.chunkFile(rel, content, analysis.symbols);
    const sqliteChunkRecords: ChunkRecord[] = chunks.map(chunk => ({
      id: chunk.id,
      file_id: fileId,
      symbol_id: chunk.symbolId,
      name: chunk.name,
      chunk_type: chunk.chunkType,
      start_line: chunk.startLine,
      end_line: chunk.endLine,
      content: chunk.content,
      content_hash: chunk.contentHash
    }));

    repoManager.saveChunks(fileId, sqliteChunkRecords);

    // Embed Chunks
    try {
      const embeddingProvider = createEmbeddingProvider(this.projectRoot);
      const vectorStore = new LanceVectorStore(vectorsDir);
      await vectorStore.initialize();

      const batchTexts = chunks.map(c => c.enrichedContent);
      const embeddings = await embeddingProvider.generateEmbeddings(batchTexts, batchTexts.length);

      const vectorRecords: VectorRecord[] = chunks.map((chunk, idx) => ({
        id: chunk.id,
        vector: embeddings[idx],
        filePath: chunk.filePath,
        symbolName: chunk.name,
        chunkType: chunk.chunkType,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        content: chunk.content,
        contentHash: chunk.contentHash
      }));

      await vectorStore.upsertChunks(vectorRecords);
    } catch (err: any) {
      Logger.debug("pipeline", `Incremental embedding skipped: ${err.message}`);
    }

    return {
      symbolCount: analysis.symbols.length,
      chunkCount: chunks.length
    };
  }

  /**
   * Removes a deleted file's metadata and vector chunks.
   */
  async removeFile(relativePath: string): Promise<void> {
    const dbPath = ConfigManager.getMetadataDbPath(this.projectRoot);
    const db = SqliteDatabase.get(dbPath);
    const repoManager = new SqliteRepositoryManager(db);
    const projectName = path.basename(this.projectRoot);
    const repo = repoManager.getOrCreateRepository(this.projectRoot, projectName);

    const allFiles = repoManager.getAllFiles(repo.id);
    const file = allFiles.find(f => f.path === relativePath);

    if (file) {
      db.prepare(`DELETE FROM chunks WHERE file_id = ?`).run(file.id);
      db.prepare(`DELETE FROM relationships WHERE file_id = ?`).run(file.id);
      db.prepare(`DELETE FROM symbols WHERE file_id = ?`).run(file.id);
      db.prepare(`DELETE FROM files WHERE id = ?`).run(file.id);
    }
  }
}
