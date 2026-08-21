import fs from "node:fs";
import path from "node:path";
import * as lancedb from "@lancedb/lancedb";
import { VECTOR_TABLE_NAME } from "../../config/constants.js";
import { Logger } from "../../utils/logger.js";

export interface VectorRecord {
  id: string;
  vector: number[];
  filePath: string;
  symbolName: string;
  chunkType: string;
  startLine: number;
  endLine: number;
  content: string;
  contentHash: string;
  [key: string]: unknown;
}

export interface VectorSearchResult {
  id: string;
  filePath: string;
  symbolName: string;
  chunkType: string;
  startLine: number;
  endLine: number;
  content: string;
  contentHash: string;
  score: number;
}

export class LanceVectorStore {
  private readonly vectorsDir: string;
  private db: lancedb.Connection | null = null;
  private fallbackMemoryStore: VectorRecord[] = [];
  private useFallback: boolean = false;
  private readonly fallbackJsonPath: string;

  constructor(vectorsDir: string) {
    this.vectorsDir = path.resolve(vectorsDir);
    this.fallbackJsonPath = path.join(this.vectorsDir, "vectors_fallback.json");
  }

  async initialize(): Promise<void> {
    if (!fs.existsSync(this.vectorsDir)) {
      fs.mkdirSync(this.vectorsDir, { recursive: true });
    }

    try {
      this.db = await lancedb.connect(this.vectorsDir);
    } catch (err: any) {
      Logger.debug("lance-store", `LanceDB connect failed, enabling fallback: ${err.message}`);
      this.useFallback = true;
      this.loadFallback();
    }
  }

  private loadFallback(): void {
    if (fs.existsSync(this.fallbackJsonPath)) {
      try {
        const raw = fs.readFileSync(this.fallbackJsonPath, "utf8");
        this.fallbackMemoryStore = JSON.parse(raw);
      } catch {
        this.fallbackMemoryStore = [];
      }
    }
  }

  private saveFallback(): void {
    try {
      fs.writeFileSync(this.fallbackJsonPath, JSON.stringify(this.fallbackMemoryStore), "utf8");
    } catch (err: any) {
      Logger.debug("lance-store", `Failed to persist fallback vectors: ${err.message}`);
    }
  }

  private async getTable(): Promise<lancedb.Table | null> {
    if (this.useFallback) return null;

    if (!this.db) {
      await this.initialize();
    }
    if (this.useFallback || !this.db) return null;

    try {
      const tableNames = await this.db.tableNames();
      if (tableNames.includes(VECTOR_TABLE_NAME)) {
        return await this.db.openTable(VECTOR_TABLE_NAME);
      }
    } catch (err: any) {
      Logger.debug("lance-store", `LanceDB table access failed: ${err.message}`);
      this.useFallback = true;
      this.loadFallback();
    }
    return null;
  }

  /**
   * Batch adds or replaces chunk vector records with seamless fallback on non-POSIX/exFAT filesystems.
   */
  async upsertChunks(records: VectorRecord[]): Promise<void> {
    if (records.length === 0) return;

    if (!this.useFallback) {
      try {
        if (!this.db) await this.initialize();
        if (this.db) {
          const tableNames = await this.db.tableNames();

          if (!tableNames.includes(VECTOR_TABLE_NAME)) {
            await this.db.createTable(VECTOR_TABLE_NAME, records as Record<string, unknown>[]);
            return;
          } else {
            const table = await this.db.openTable(VECTOR_TABLE_NAME);
            const idsToDelete = records.map(r => `"${r.id}"`).join(", ");
            try {
              await table.delete(`id IN (${idsToDelete})`);
            } catch {
              // Ignore
            }
            await table.add(records as Record<string, unknown>[]);
            return;
          }
        }
      } catch (err: any) {
        // Filesystem error (e.g. exFAT os error 45 Operation not supported)
        Logger.debug("lance-store", `LanceDB table write error on this filesystem (${err.message}). Switching to embedded vector fallback.`);
        this.useFallback = true;
      }
    }

    // Fallback store
    this.loadFallback();
    const map = new Map<string, VectorRecord>();
    for (const r of this.fallbackMemoryStore) {
      map.set(r.id, r);
    }
    for (const r of records) {
      map.set(r.id, r);
    }
    this.fallbackMemoryStore = Array.from(map.values());
    this.saveFallback();
  }

  /**
   * Searches for top-K nearest neighbor chunks using cosine similarity.
   */
  async search(queryVector: number[], limit: number = 10): Promise<VectorSearchResult[]> {
    if (!this.useFallback) {
      try {
        const table = await this.getTable();
        if (table) {
          const results = await table.vectorSearch(queryVector).limit(limit).toArray();

          return results.map((row: any) => {
            const distance = row._distance ?? 0;
            const score = Math.max(0, 1 / (1 + distance));

            return {
              id: row.id,
              filePath: row.filePath,
              symbolName: row.symbolName,
              chunkType: row.chunkType,
              startLine: row.startLine,
              endLine: row.endLine,
              content: row.content,
              contentHash: row.contentHash,
              score
            };
          });
        }
      } catch (err: any) {
        Logger.debug("lance-store", `LanceDB search failed: ${err.message}, using fallback.`);
        this.useFallback = true;
      }
    }

    // Fallback search using exact cosine similarity
    this.loadFallback();
    if (this.fallbackMemoryStore.length === 0) return [];

    const scored = this.fallbackMemoryStore.map(record => {
      const sim = this.cosineSimilarity(queryVector, record.vector);
      return {
        id: record.id,
        filePath: record.filePath,
        symbolName: record.symbolName,
        chunkType: record.chunkType,
        startLine: record.startLine,
        endLine: record.endLine,
        content: record.content,
        contentHash: record.contentHash,
        score: sim
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  /**
   * Clears all vector records.
   */
  async clear(): Promise<void> {
    if (this.db && !this.useFallback) {
      try {
        const tableNames = await this.db.tableNames();
        if (tableNames.includes(VECTOR_TABLE_NAME)) {
          await this.db.dropTable(VECTOR_TABLE_NAME);
        }
      } catch {
        // Ignore
      }
    }

    this.fallbackMemoryStore = [];
    if (fs.existsSync(this.fallbackJsonPath)) {
      try {
        fs.unlinkSync(this.fallbackJsonPath);
      } catch {
        // Ignore
      }
    }
  }
}
