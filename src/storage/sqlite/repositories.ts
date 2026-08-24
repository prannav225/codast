import type { Database } from "better-sqlite3";
import { type ScannedFile } from "../../core/scanner/scanner.js";
import {
  type ExtractedSymbol,
  type ExtractedRelationship
} from "../../core/analysis/types.js";

export interface RepositoryRecord {
  id: number;
  root_path: string;
  name: string;
  status: string;
  created_at: string;
  last_indexed_at: string | null;
}

export interface FileRecord {
  id: number;
  repository_id: number;
  path: string;
  extension: string;
  content_hash: string;
  line_count: number;
  updated_at: string;
}

export interface SymbolRecord {
  id: string;
  file_id: number;
  name: string;
  kind: string;
  start_line: number;
  end_line: number;
  signature: string;
  doc_comment?: string;
  is_exported: number;
  is_default_export: number;
  file_path?: string;
}

export interface RelationshipRecord {
  id: number;
  repository_id: number;
  source_file_id: number;
  source_symbol_name?: string;
  target_file_id?: number;
  target_symbol_name?: string;
  target_module?: string;
  type: string;
  line: number;
  source_file_path?: string;
}

export interface ChunkRecord {
  id: string;
  file_id: number;
  symbol_id?: string;
  name: string;
  chunk_type: string;
  start_line: number;
  end_line: number;
  content: string;
  content_hash: string;
  file_path?: string;
}

export class SqliteRepositoryManager {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  getOrCreateRepository(rootPath: string, name: string): RepositoryRecord {
    const existing = this.db.prepare<[string], RepositoryRecord>(
      "SELECT * FROM repositories WHERE root_path = ?"
    ).get(rootPath);

    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const result = this.db.prepare(
      "INSERT INTO repositories (root_path, name, status, created_at) VALUES (?, ?, 'PENDING', ?)"
    ).run(rootPath, name, now);

    return {
      id: Number(result.lastInsertRowid),
      root_path: rootPath,
      name,
      status: "PENDING",
      created_at: now,
      last_indexed_at: null
    };
  }

  updateRepositoryStatus(repoId: number, status: "PENDING" | "INDEXED" | "FAILED", lastIndexedAt?: string): void {
    const now = lastIndexedAt || new Date().toISOString();
    this.db.prepare(
      "UPDATE repositories SET status = ?, last_indexed_at = ? WHERE id = ?"
    ).run(status, now, repoId);
  }

  clearRepositoryData(repoId: number): void {
    const clearTx = this.db.transaction(() => {
      this.db.prepare("DELETE FROM relationships WHERE repository_id = ?").run(repoId);
      this.db.prepare("DELETE FROM files WHERE repository_id = ?").run(repoId);
    });
    clearTx();
  }

  saveFile(repoId: number, file: ScannedFile): number {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO files (repository_id, path, extension, content_hash, line_count, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(repository_id, path) DO UPDATE SET
        content_hash = excluded.content_hash,
        line_count = excluded.line_count,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      repoId,
      file.relativePath,
      file.extension,
      file.contentHash,
      file.lineCount,
      now
    );

    const existing = this.db.prepare<[number, string], { id: number }>(
      "SELECT id FROM files WHERE repository_id = ? AND path = ?"
    ).get(repoId, file.relativePath);

    return existing!.id;
  }

  saveSymbols(fileId: number, symbols: ExtractedSymbol[]): void {
    if (symbols.length === 0) return;

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO symbols (id, file_id, name, kind, start_line, end_line, signature, doc_comment, is_exported, is_default_export)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((items: ExtractedSymbol[]) => {
      for (const sym of items) {
        stmt.run(
          sym.id,
          fileId,
          sym.name,
          sym.kind,
          sym.startLine,
          sym.endLine,
          sym.signature,
          sym.docComment || null,
          sym.isExported ? 1 : 0,
          sym.isDefaultExport ? 1 : 0
        );
      }
    });

    insertMany(symbols);
  }

  saveRelationships(repoId: number, sourceFileId: number, relationships: ExtractedRelationship[]): void {
    if (relationships.length === 0) return;

    const stmt = this.db.prepare(`
      INSERT INTO relationships (repository_id, source_file_id, source_symbol_name, target_symbol_name, target_module, type, line)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((items: ExtractedRelationship[]) => {
      for (const rel of items) {
        stmt.run(
          repoId,
          sourceFileId,
          rel.sourceSymbolName || null,
          rel.targetSymbolName || null,
          rel.targetModule || null,
          rel.type,
          rel.line
        );
      }
    });

    insertMany(relationships);
  }

  saveChunks(fileId: number, chunks: ChunkRecord[]): void {
    if (chunks.length === 0) return;

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO chunks (id, file_id, symbol_id, name, chunk_type, start_line, end_line, content, content_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((items: ChunkRecord[]) => {
      for (const chunk of items) {
        stmt.run(
          chunk.id,
          fileId,
          chunk.symbol_id || null,
          chunk.name,
          chunk.chunk_type,
          chunk.start_line,
          chunk.end_line,
          chunk.content,
          chunk.content_hash
        );
      }
    });

    insertMany(chunks);
  }

  getProjectStats(repoId: number) {
    const fileRow: any = this.db.prepare("SELECT COUNT(*) as count FROM files WHERE repository_id = ?").get(repoId);
    const symRow: any = this.db.prepare(`
      SELECT COUNT(*) as count FROM symbols s
      JOIN files f ON s.file_id = f.id
      WHERE f.repository_id = ?
    `).get(repoId);
    const relRow: any = this.db.prepare("SELECT COUNT(*) as count FROM relationships WHERE repository_id = ?").get(repoId);
    const chunkRow: any = this.db.prepare(`
      SELECT COUNT(*) as count FROM chunks c
      JOIN files f ON c.file_id = f.id
      WHERE f.repository_id = ?
    `).get(repoId);

    return {
      fileCount: fileRow?.count ?? 0,
      symbolCount: symRow?.count ?? 0,
      relationshipCount: relRow?.count ?? 0,
      chunkCount: chunkRow?.count ?? 0
    };
  }

  findSymbolsByName(repoId: number, name: string, exact: boolean = false): SymbolRecord[] {
    const query = exact
      ? `
        SELECT s.*, f.path as file_path FROM symbols s
        JOIN files f ON s.file_id = f.id
        WHERE f.repository_id = ? AND s.name = ?
      `
      : `
        SELECT s.*, f.path as file_path FROM symbols s
        JOIN files f ON s.file_id = f.id
        WHERE f.repository_id = ? AND s.name LIKE ?
      `;

    const param = exact ? name : `%${name}%`;
    return this.db.prepare(query).all(repoId, param) as SymbolRecord[];
  }

  findRelationshipsForSymbol(repoId: number, symbolName: string): RelationshipRecord[] {
    const query = `
      SELECT r.*, f.path as source_file_path FROM relationships r
      JOIN files f ON r.source_file_id = f.id
      WHERE r.repository_id = ? AND (r.source_symbol_name = ? OR r.target_symbol_name = ? OR r.target_symbol_name LIKE ?)
    `;

    return this.db.prepare(query).all(repoId, symbolName, symbolName, `%${symbolName}%`) as RelationshipRecord[];
  }

  getAllFiles(repoId: number): FileRecord[] {
    return this.db.prepare<[number], FileRecord>("SELECT * FROM files WHERE repository_id = ?").all(repoId);
  }

  getAllRelationships(repoId: number): RelationshipRecord[] {
    const query = `
      SELECT r.*, f.path as source_file_path FROM relationships r
      JOIN files f ON r.source_file_id = f.id
      WHERE r.repository_id = ?
    `;
    return this.db.prepare(query).all(repoId) as RelationshipRecord[];
  }

  getAllChunks(repoId: number): ChunkRecord[] {
    const query = `
      SELECT c.*, f.path as file_path FROM chunks c
      JOIN files f ON c.file_id = f.id
      WHERE f.repository_id = ?
    `;
    return this.db.prepare(query).all(repoId) as ChunkRecord[];
  }
}
