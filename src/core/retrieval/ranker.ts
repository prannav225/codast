import { type RetrievedChunk } from "./symbol-search.js";

export interface RankedContext {
  chunks: RetrievedChunk[];
  assembledContextText: string;
  totalCharacters: number;
  totalChunksCount: number;
  tokenEstimate: number;
}

export class ContextRanker {
  private static readonly DEFAULT_MAX_CHARACTERS = 35000;

  /**
   * Deduplicates, scores, ranks, and budgets retrieved chunks into an assembled context payload.
   */
  static rankAndAssemble(
    chunkSets: RetrievedChunk[][],
    maxCharacters: number = this.DEFAULT_MAX_CHARACTERS
  ): RankedContext {
    const chunkMap = new Map<string, { chunk: RetrievedChunk; combinedScore: number; sources: Set<string> }>();

    for (const set of chunkSets) {
      for (const item of set) {
        if (!chunkMap.has(item.id)) {
          chunkMap.set(item.id, {
            chunk: item,
            combinedScore: item.score,
            sources: new Set([item.retrievalSource])
          });
        } else {
          const existing = chunkMap.get(item.id)!;
          existing.combinedScore += item.score * 0.5; // Multi-source convergence boost
          existing.sources.add(item.retrievalSource);
        }
      }
    }

    const scoredList = Array.from(chunkMap.values());

    // Sort by combined score descending
    scoredList.sort((a, b) => b.combinedScore - a.combinedScore);

    const selectedChunks: RetrievedChunk[] = [];
    const contextSections: string[] = [];
    let currentChars = 0;

    for (const entry of scoredList) {
      const { chunk } = entry;
      const section = this.formatChunkSection(chunk);

      if (currentChars + section.length > maxCharacters && selectedChunks.length >= 3) {
        break;
      }

      selectedChunks.push(chunk);
      contextSections.push(section);
      currentChars += section.length;
    }

    return {
      chunks: selectedChunks,
      assembledContextText: contextSections.join("\n\n"),
      totalCharacters: currentChars,
      totalChunksCount: selectedChunks.length,
      tokenEstimate: Math.round(currentChars / 4)
    };
  }

  private static formatChunkSection(chunk: RetrievedChunk): string {
    const header = `### File: ${chunk.filePath} (Lines ${chunk.startLine}-${chunk.endLine}) [${chunk.chunkType}: ${chunk.symbolName}]`;
    const ext = chunk.filePath.split(".").pop() || "typescript";
    return `${header}\n\`\`\`${ext}\n${chunk.content}\n\`\`\``;
  }
}
