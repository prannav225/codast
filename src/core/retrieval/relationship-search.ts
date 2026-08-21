import type { Database } from "better-sqlite3";
import { SqliteRepositoryManager, type ChunkRecord } from "../../storage/sqlite/repositories.js";
import { type RetrievedChunk } from "./symbol-search.js";

export class RelationshipSearch {
  private readonly repoManager: SqliteRepositoryManager;
  private readonly repoId: number;

  constructor(db: Database, repoId: number) {
    this.repoManager = new SqliteRepositoryManager(db);
    this.repoId = repoId;
  }

  /**
   * Expands candidate chunks by traversing upstream and downstream graph dependencies (CALLS, USES, IMPORTS).
   */
  expandRelationships(initialCandidates: RetrievedChunk[], maxHops: number = 1): RetrievedChunk[] {
    const expanded: RetrievedChunk[] = [];
    const seenChunkIds = new Set<string>(initialCandidates.map(c => c.id));
    const allChunks = this.repoManager.getAllChunks(this.repoId);

    // Map chunk by symbol name or file path for fast lookup
    const chunksBySymbolName = new Map<string, ChunkRecord[]>();
    const chunksByFilePath = new Map<string, ChunkRecord[]>();

    for (const chunk of allChunks) {
      if (!chunksBySymbolName.has(chunk.name)) {
        chunksBySymbolName.set(chunk.name, []);
      }
      chunksBySymbolName.get(chunk.name)!.push(chunk);

      if (chunk.file_path) {
        if (!chunksByFilePath.has(chunk.file_path)) {
          chunksByFilePath.set(chunk.file_path, []);
        }
        chunksByFilePath.get(chunk.file_path)!.push(chunk);
      }
    }

    const symbolsToExplore = new Set<string>();
    for (const candidate of initialCandidates) {
      if (candidate.symbolName && candidate.symbolName !== "module-level") {
        symbolsToExplore.add(candidate.symbolName);
      }
    }

    for (const symbol of symbolsToExplore) {
      const relationships = this.repoManager.findRelationshipsForSymbol(this.repoId, symbol);

      for (const rel of relationships) {
        const connectedSymbolName = rel.source_symbol_name === symbol
          ? rel.target_symbol_name
          : rel.source_symbol_name;

        if (connectedSymbolName) {
          const matchedChunks = chunksBySymbolName.get(connectedSymbolName) || [];
          for (const chunk of matchedChunks) {
            if (!seenChunkIds.has(chunk.id)) {
              expanded.push({
                id: chunk.id,
                filePath: chunk.file_path || "",
                symbolName: chunk.name,
                chunkType: chunk.chunk_type,
                startLine: chunk.start_line,
                endLine: chunk.end_line,
                content: chunk.content,
                score: 0.7,
                retrievalSource: "relationship"
              });
              seenChunkIds.add(chunk.id);
            }
          }
        }

        // If targetModule links to a known local file path, include top exports/chunks from that module
        if (rel.target_module && rel.target_module.startsWith(".")) {
          for (const [filePath, fileChunks] of chunksByFilePath.entries()) {
            if (filePath.includes(rel.target_module.replace(/^\.\.?\//, ""))) {
              for (const chunk of fileChunks.slice(0, 2)) {
                if (!seenChunkIds.has(chunk.id)) {
                  expanded.push({
                    id: chunk.id,
                    filePath: chunk.file_path || "",
                    symbolName: chunk.name,
                    chunkType: chunk.chunk_type,
                    startLine: chunk.start_line,
                    endLine: chunk.end_line,
                    content: chunk.content,
                    score: 0.6,
                    retrievalSource: "relationship"
                  });
                  seenChunkIds.add(chunk.id);
                }
              }
            }
          }
        }
      }
    }

    return expanded;
  }
}
