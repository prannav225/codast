import type { Database } from "better-sqlite3";
import { LanceVectorStore } from "../../storage/vector/lance-store.js";
import { type EmbeddingProvider } from "../ai/voyage-provider.js";
import { SymbolSearch, type RetrievedChunk } from "./symbol-search.js";
import { VectorSearch } from "./vector-search.js";
import { RelationshipSearch } from "./relationship-search.js";
import { ContextRanker, type RankedContext } from "./ranker.js";
import { SqliteRepositoryManager } from "../../storage/sqlite/repositories.js";
import { Logger } from "../../utils/logger.js";

export class RetrievalEngine {
  private readonly symbolSearch: SymbolSearch;
  private readonly vectorSearch: VectorSearch;
  private readonly relationshipSearch: RelationshipSearch;
  private readonly repoManager: SqliteRepositoryManager;
  private readonly repoId: number;

  constructor(db: Database, repoId: number, vectorStore: LanceVectorStore, embeddingProvider: EmbeddingProvider) {
    this.repoManager = new SqliteRepositoryManager(db);
    this.repoId = repoId;
    this.symbolSearch = new SymbolSearch(db, repoId);
    this.vectorSearch = new VectorSearch(vectorStore, embeddingProvider);
    this.relationshipSearch = new RelationshipSearch(db, repoId);
  }

  /**
   * Performs parallel multi-modal hybrid retrieval combining exact symbols, vectors, and graph relationships.
   */
  async retrieveContext(query: string, maxCharacters?: number): Promise<RankedContext> {
    Logger.debug("retrieval", `Executing hybrid search for: "${query}"`);

    const lowerQuery = query.toLowerCase();
    const isBroadQuery =
      lowerQuery.includes("what does") ||
      lowerQuery.includes("what is it about") ||
      lowerQuery.includes("explain the project") ||
      lowerQuery.includes("project structure") ||
      lowerQuery.includes("overview") ||
      lowerQuery.includes("architecture");

    // 1. Run Symbol search & Vector search in parallel
    const [symbolResults, vectorResults] = await Promise.all([
      Promise.resolve(this.symbolSearch.search(query)),
      this.vectorSearch.search(query, 15)
    ]);

    Logger.debug("retrieval", `Found ${symbolResults.length} symbol matches and ${vectorResults.length} vector matches`);

    // 2. Expand graph relationships based on top candidate nodes
    const topCandidates = [...symbolResults.slice(0, 6), ...vectorResults.slice(0, 6)];
    const relationshipResults = this.relationshipSearch.expandRelationships(topCandidates);

    Logger.debug("retrieval", `Discovered ${relationshipResults.length} graph relationship expansions`);

    // 3. For broad queries, pull in root entrypoint files & core models
    let broadContextChunks: RetrievedChunk[] = [];
    if (isBroadQuery || symbolResults.length + vectorResults.length === 0) {
      const allChunks = this.repoManager.getAllChunks(this.repoId);
      const entrypoints = allChunks.filter(c => {
        const p = (c.file_path || "").toLowerCase();
        return (
          p.includes("app.t") ||
          p.includes("app.j") ||
          p.includes("index.t") ||
          p.includes("index.j") ||
          p.includes("main.t") ||
          p.includes("main.j") ||
          p.includes("route") ||
          p.includes("router") ||
          p.includes("store") ||
          p.includes("service") ||
          p.includes("auth") ||
          p.includes("config")
        );
      });

      broadContextChunks = (entrypoints.length > 0 ? entrypoints : allChunks)
        .slice(0, 10)
        .map(c => ({
          id: c.id,
          filePath: c.file_path || "",
          symbolName: c.name,
          chunkType: c.chunk_type,
          startLine: c.start_line,
          endLine: c.end_line,
          content: c.content,
          score: 0.7,
          retrievalSource: "symbol" as const
        }));
    }

    // 4. Rank, deduplicate, and assemble budget
    let rankedContext = ContextRanker.rankAndAssemble(
      [symbolResults, vectorResults, relationshipResults, broadContextChunks],
      maxCharacters
    );

    Logger.debug("retrieval", `Assembled ${rankedContext.totalChunksCount} chunks (${rankedContext.totalCharacters} chars)`);

    return rankedContext;
  }
}
