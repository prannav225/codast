import { LanceVectorStore } from "../../storage/vector/lance-store.js";
import { type EmbeddingProvider } from "../ai/voyage-provider.js";
import { type RetrievedChunk } from "./symbol-search.js";

export class VectorSearch {
  private readonly vectorStore: LanceVectorStore;
  private readonly embeddingProvider: EmbeddingProvider;

  constructor(vectorStore: LanceVectorStore, embeddingProvider: EmbeddingProvider) {
    this.vectorStore = vectorStore;
    this.embeddingProvider = embeddingProvider;
  }

  /**
   * Generates embedding for query and searches nearest neighbor code chunks in LanceDB.
   * Includes a 4-second fast timeout so search never blocks on slow or rate-limited cloud APIs.
   */
  async search(query: string, limit: number = 10): Promise<RetrievedChunk[]> {
    try {
      const queryVectorPromise = this.embeddingProvider.generateEmbedding(query);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Vector query timeout")), 4000)
      );

      const queryVector = await Promise.race([queryVectorPromise, timeoutPromise]);
      const vectorResults = await this.vectorStore.search(queryVector, limit);

      return vectorResults.map(res => ({
        id: res.id,
        filePath: res.filePath,
        symbolName: res.symbolName,
        chunkType: res.chunkType,
        startLine: res.startLine,
        endLine: res.endLine,
        content: res.content,
        score: res.score,
        retrievalSource: "vector"
      }));
    } catch {
      // Gracefully fall back to symbol and relationship search
      return [];
    }
  }
}
