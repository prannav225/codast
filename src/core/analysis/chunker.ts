import path from "node:path";
import { computeHash } from "../../utils/hash.js";
import { type ExtractedSymbol } from "./types.js";

export interface LogicalChunk {
  id: string;
  filePath: string;
  symbolId?: string;
  name: string;
  chunkType: string;
  startLine: number;
  endLine: number;
  content: string;
  enrichedContent: string;
  contentHash: string;
}

export interface ChunkerOptions {
  maxChunkLines?: number;
  chunkOverlapLines?: number;
  minModuleChunkLines?: number;
}

export class LogicalChunker {
  private static readonly DEFAULT_MAX_LINES = 100;
  private static readonly DEFAULT_OVERLAP_LINES = 15;
  private static readonly DEFAULT_MIN_MODULE_LINES = 3;

  /**
   * Chunks a source file by AST symbol boundaries with fallback module gap capture.
   */
  static chunkFile(
    filePath: string,
    fileContent: string,
    symbols: ExtractedSymbol[],
    options: ChunkerOptions = {}
  ): LogicalChunk[] {
    const maxLines = options.maxChunkLines || this.DEFAULT_MAX_LINES;
    const overlap = options.chunkOverlapLines || this.DEFAULT_OVERLAP_LINES;
    const minModuleLines = options.minModuleChunkLines || this.DEFAULT_MIN_MODULE_LINES;

    const fileLines = fileContent.split(/\r\n|\r|\n/);
    const totalLines = fileLines.length;

    if (totalLines === 0 || fileContent.trim().length === 0) {
      return [];
    }

    const chunks: LogicalChunk[] = [];
    const coveredIntervals: Array<{ start: number; end: number }> = [];

    const sortedSymbols = [...symbols].sort((a, b) => a.startLine - b.startLine);

    for (const sym of sortedSymbols) {
      const symLinesCount = sym.endLine - sym.startLine + 1;
      const rawSlice = fileLines.slice(sym.startLine - 1, sym.endLine).join("\n");

      if (symLinesCount <= maxLines) {
        const chunkId = `${filePath}#${sym.name}:${sym.startLine}-${sym.endLine}`;
        const enriched = this.enrichChunk(filePath, sym.name, sym.kind, sym.startLine, sym.endLine, rawSlice, sym.signature, sym.docComment);

        chunks.push({
          id: chunkId,
          filePath,
          symbolId: sym.id,
          name: sym.name,
          chunkType: sym.kind,
          startLine: sym.startLine,
          endLine: sym.endLine,
          content: rawSlice,
          enrichedContent: enriched,
          contentHash: computeHash(rawSlice)
        });

        coveredIntervals.push({ start: sym.startLine, end: sym.endLine });
      } else {
        // Large AST symbol: Secondary sliding window split
        let currentStart = sym.startLine;
        let partIndex = 1;

        while (currentStart <= sym.endLine) {
          const currentEnd = Math.min(currentStart + maxLines - 1, sym.endLine);
          const partSlice = fileLines.slice(currentStart - 1, currentEnd).join("\n");
          const chunkId = `${filePath}#${sym.name}:part${partIndex}:${currentStart}-${currentEnd}`;
          const enriched = this.enrichChunk(
            filePath,
            `${sym.name} (Part ${partIndex})`,
            sym.kind,
            currentStart,
            currentEnd,
            partSlice,
            sym.signature,
            sym.docComment
          );

          chunks.push({
            id: chunkId,
            filePath,
            symbolId: sym.id,
            name: `${sym.name} (Part ${partIndex})`,
            chunkType: sym.kind,
            startLine: currentStart,
            endLine: currentEnd,
            content: partSlice,
            enrichedContent: enriched,
            contentHash: computeHash(partSlice)
          });

          if (currentEnd >= sym.endLine) {
            break;
          }
          currentStart = currentEnd - overlap + 1;
          partIndex++;
        }

        coveredIntervals.push({ start: sym.startLine, end: sym.endLine });
      }
    }

    // Capture uncovered module-level gaps
    const mergedIntervals = this.mergeIntervals(coveredIntervals);
    let lastCoveredLine = 0;

    for (const interval of mergedIntervals) {
      if (interval.start > lastCoveredLine + 1) {
        const gapStart = lastCoveredLine + 1;
        const gapEnd = interval.start - 1;
        this.addModuleChunkIfMeaningful(filePath, fileLines, gapStart, gapEnd, minModuleLines, chunks);
      }
      lastCoveredLine = Math.max(lastCoveredLine, interval.end);
    }

    // Trailing gap at bottom of file
    if (lastCoveredLine < totalLines) {
      const gapStart = lastCoveredLine + 1;
      const gapEnd = totalLines;
      this.addModuleChunkIfMeaningful(filePath, fileLines, gapStart, gapEnd, minModuleLines, chunks);
    }

    chunks.sort((a, b) => a.startLine - b.startLine);
    return chunks;
  }

  private static addModuleChunkIfMeaningful(
    filePath: string,
    fileLines: string[],
    startLine: number,
    endLine: number,
    minLines: number,
    chunks: LogicalChunk[]
  ): void {
    const rawSlice = fileLines.slice(startLine - 1, endLine).join("\n");
    const trimmed = rawSlice.trim();

    if (trimmed.length === 0) return;
    const lineCount = endLine - startLine + 1;

    if (lineCount < minLines && !trimmed.includes("import") && !trimmed.includes("export") && !trimmed.includes("const") && !trimmed.includes("def")) {
      return;
    }

    const chunkId = `${filePath}#module:${startLine}-${endLine}`;
    const enriched = this.enrichChunk(filePath, "module-level", "module", startLine, endLine, rawSlice);

    chunks.push({
      id: chunkId,
      filePath,
      name: "module-level",
      chunkType: "module",
      startLine,
      endLine,
      content: rawSlice,
      enrichedContent: enriched,
      contentHash: computeHash(rawSlice)
    });
  }

  private static enrichChunk(
    filePath: string,
    name: string,
    type: string,
    startLine: number,
    endLine: number,
    content: string,
    signature?: string,
    docComment?: string
  ): string {
    const ext = path.extname(filePath).toLowerCase();
    const commentPrefix = this.getCommentPrefix(ext);

    const parts: string[] = [];
    parts.push(`${commentPrefix} File: ${filePath}`);
    parts.push(`${commentPrefix} Symbol: ${name} (${type}) | Lines: ${startLine}-${endLine}`);
    if (signature) {
      parts.push(`${commentPrefix} Signature: ${signature}`);
    }
    if (docComment) {
      parts.push(`${commentPrefix} Documentation:\n${docComment}`);
    }
    parts.push("");
    parts.push(content);

    return parts.join("\n");
  }

  private static getCommentPrefix(ext: string): string {
    if (ext === ".py" || ext === ".pyi" || ext === ".rb" || ext === ".yaml" || ext === ".yml" || ext === ".sh") {
      return "#";
    }
    if (ext === ".sql") {
      return "--";
    }
    return "//";
  }

  private static mergeIntervals(intervals: Array<{ start: number; end: number }>): Array<{ start: number; end: number }> {
    if (intervals.length === 0) return [];
    const sorted = [...intervals].sort((a, b) => a.start - b.start);
    const merged: Array<{ start: number; end: number }> = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const last = merged[merged.length - 1];

      if (current.start <= last.end + 1) {
        last.end = Math.max(last.end, current.end);
      } else {
        merged.push(current);
      }
    }

    return merged;
  }
}
