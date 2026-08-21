import type { Database } from "better-sqlite3";
import { SqliteRepositoryManager, type ChunkRecord } from "../../storage/sqlite/repositories.js";

export interface RetrievedChunk {
  id: string;
  filePath: string;
  symbolName: string;
  chunkType: string;
  startLine: number;
  endLine: number;
  content: string;
  score: number;
  retrievalSource: "symbol" | "vector" | "relationship";
}

export class SymbolSearch {
  private readonly repoManager: SqliteRepositoryManager;
  private readonly repoId: number;

  constructor(db: Database, repoId: number) {
    this.repoManager = new SqliteRepositoryManager(db);
    this.repoId = repoId;
  }

  /**
   * Searches for chunks matching identifiers, symbol names, and file paths mentioned in the query.
   */
  search(query: string): RetrievedChunk[] {
    const candidates: RetrievedChunk[] = [];
    const extractedKeywords = this.extractPotentialIdentifiers(query);

    if (extractedKeywords.length === 0) {
      return candidates;
    }

    const allChunks = this.repoManager.getAllChunks(this.repoId);
    const seenChunkIds = new Set<string>();

    for (const keyword of extractedKeywords) {
      // 1. Match symbols
      const symbols = this.repoManager.findSymbolsByName(this.repoId, keyword, false);
      const symbolNames = new Set(symbols.map(s => s.name.toLowerCase()));

      for (const chunk of allChunks) {
        if (seenChunkIds.has(chunk.id)) continue;

        const isExactSymbolMatch = chunk.name.toLowerCase() === keyword.toLowerCase();
        const isPartialSymbolMatch = chunk.name.toLowerCase().includes(keyword.toLowerCase());
        const isFilePathMatch = (chunk.file_path || "").toLowerCase().includes(keyword.toLowerCase());

        if (isExactSymbolMatch) {
          candidates.push({
            id: chunk.id,
            filePath: chunk.file_path || "",
            symbolName: chunk.name,
            chunkType: chunk.chunk_type,
            startLine: chunk.start_line,
            endLine: chunk.end_line,
            content: chunk.content,
            score: 1.0,
            retrievalSource: "symbol"
          });
          seenChunkIds.add(chunk.id);
        } else if (isPartialSymbolMatch || isFilePathMatch) {
          candidates.push({
            id: chunk.id,
            filePath: chunk.file_path || "",
            symbolName: chunk.name,
            chunkType: chunk.chunk_type,
            startLine: chunk.start_line,
            endLine: chunk.end_line,
            content: chunk.content,
            score: 0.8,
            retrievalSource: "symbol"
          });
          seenChunkIds.add(chunk.id);
        }
      }
    }

    return candidates;
  }

  private extractPotentialIdentifiers(query: string): string[] {
    const keywords: string[] = [];

    // Match words in quotes: "useAuth" or 'AuthService'
    const quotedRegex = /["']([a-zA-Z0-9_.-]+)["']/g;
    let match;
    while ((match = quotedRegex.exec(query)) !== null) {
      keywords.push(match[1]);
    }

    // Match PascalCase, camelCase, snake_case or kebab-case words
    const tokens = query.split(/[\s,?!;:]+/);
    for (const token of tokens) {
      const clean = token.replace(/[^a-zA-Z0-9_.-]/g, "");
      if (clean.length > 2) {
        // Skip generic common English stop words
        if (!this.isStopWord(clean.toLowerCase())) {
          keywords.push(clean);
        }
      }
    }

    return Array.from(new Set(keywords));
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      "where", "what", "when", "which", "how", "why", "who", "does", "explain",
      "show", "find", "get", "the", "and", "for", "with", "from", "that", "this",
      "into", "code", "file", "files", "project", "work", "works", "handled",
      "implemented", "used", "call", "calls", "happens", "after", "before"
    ]);
    return stopWords.has(word);
  }
}
