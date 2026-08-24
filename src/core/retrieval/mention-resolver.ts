import fs from "node:fs";
import path from "node:path";
import type { Database } from "better-sqlite3";
import { type RetrievedChunk } from "./symbol-search.js";
import { SqliteRepositoryManager } from "../../storage/sqlite/repositories.js";
import { Logger } from "../../utils/logger.js";

export class MentionResolver {
  private readonly projectRoot: string;
  private readonly repoManager: SqliteRepositoryManager;
  private readonly repoId: number;

  constructor(db: Database, repoId: number, projectRoot: string) {
    this.projectRoot = path.resolve(projectRoot);
    this.repoManager = new SqliteRepositoryManager(db);
    this.repoId = repoId;
  }

  /**
   * Resolves explicit `@file` and `@Symbol` mentions from query string.
   */
  resolveMentions(query: string): { chunks: RetrievedChunk[]; cleanedQuery: string } {
    const mentionRegex = /@([a-zA-Z0-9_\-\/\\.]+(?::\d+(?:-\d+)?)?)/g;
    const matches: string[] = [];
    let match;

    while ((match = mentionRegex.exec(query)) !== null) {
      matches.push(match[1]);
    }

    if (matches.length === 0) {
      return { chunks: [], cleanedQuery: query };
    }

    const resolvedChunks: RetrievedChunk[] = [];
    const allFiles = this.repoManager.getAllFiles(this.repoId);
    const fileMap = new Map<string, { id: number; path: string }>();

    for (const f of allFiles) {
      fileMap.set(f.path.toLowerCase(), { id: f.id, path: f.path });
      // Also map basename for short @filename.ts mentions
      const base = path.basename(f.path).toLowerCase();
      if (!fileMap.has(base)) {
        fileMap.set(base, { id: f.id, path: f.path });
      }
    }

    for (const rawMention of matches) {
      let mentionTarget = rawMention;
      let lineStart: number | null = null;
      let lineEnd: number | null = null;

      // Check for line range: @file.ts:10-30
      if (rawMention.includes(":")) {
        const [target, range] = rawMention.split(":");
        mentionTarget = target;
        if (range) {
          const parts = range.split("-");
          lineStart = parseInt(parts[0], 10) || null;
          lineEnd = parts[1] ? parseInt(parts[1], 10) : lineStart;
        }
      }

      const lowerTarget = mentionTarget.toLowerCase();

      // 1. Try resolving as a file path
      if (fileMap.has(lowerTarget)) {
        const fileInfo = fileMap.get(lowerTarget)!;
        const absPath = path.isAbsolute(fileInfo.path)
          ? fileInfo.path
          : path.join(this.projectRoot, fileInfo.path);

        let rawContent: string | null = null;
        if (fs.existsSync(absPath)) {
          try {
            rawContent = fs.readFileSync(absPath, "utf8");
          } catch {
            rawContent = null;
          }
        }

        if (rawContent === null) {
          const fileChunks = this.repoManager.getAllChunks(this.repoId).filter(c => c.file_id === fileInfo.id);
          if (fileChunks.length > 0) {
            rawContent = fileChunks.map(c => c.content).join("\n\n");
          } else {
            rawContent = `// File: ${fileInfo.path}`;
          }
        }

        const lines = rawContent.split("\n");
        let chunkContent = rawContent;
        let start = 1;
        let end = lines.length;

        if (lineStart !== null && lineStart >= 1) {
          start = Math.max(1, lineStart);
          end = lineEnd !== null ? Math.min(lines.length, lineEnd) : lines.length;
          chunkContent = lines.slice(start - 1, end).join("\n");
        }

        resolvedChunks.push({
          id: `mention_file_${fileInfo.path}_${start}_${end}`,
          fileId: fileInfo.id,
          filePath: fileInfo.path,
          chunkType: "file",
          symbolName: path.basename(fileInfo.path),
          startLine: start,
          endLine: end,
          content: chunkContent,
          contentHash: "mention_hash",
          score: 100.0, // Absolute top ranking
          retrievalSource: "mention"
        });
        Logger.debug("mention-resolver", `Resolved @file mention: ${fileInfo.path} (lines ${start}-${end})`);
        continue;
      }

      // 2. Try resolving as a Symbol Name
      const matchingSymbols = this.repoManager.findSymbolsByName(this.repoId, mentionTarget);
      if (matchingSymbols.length > 0) {
        for (const sym of matchingSymbols) {
          const fileRecord = allFiles.find(f => f.id === sym.file_id);
          const relPath = fileRecord ? fileRecord.path : "unknown";
          const absPath = path.isAbsolute(relPath) ? relPath : path.join(this.projectRoot, relPath);

          let content = `// Symbol: ${sym.name} (${sym.kind})\n`;
          if (fs.existsSync(absPath)) {
            try {
              const fullText = fs.readFileSync(absPath, "utf8");
              const lines = fullText.split("\n");
              content = lines.slice(Math.max(0, sym.start_line - 1), sym.end_line).join("\n");
            } catch {}
          }

          resolvedChunks.push({
            id: `mention_sym_${sym.id}`,
            fileId: sym.file_id,
            filePath: relPath,
            chunkType: sym.kind,
            symbolName: sym.name,
            startLine: sym.start_line,
            endLine: sym.end_line,
            content,
            contentHash: "mention_sym_hash",
            score: 95.0, // Top priority
            retrievalSource: "mention"
          });
          Logger.debug("mention-resolver", `Resolved @symbol mention: ${sym.name} in ${relPath}`);
        }
      }
    }

    return {
      chunks: resolvedChunks,
      cleanedQuery: query
    };
  }
}
