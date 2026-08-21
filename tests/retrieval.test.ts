import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { SqliteDatabase } from "../src/storage/sqlite/db.js";
import { SqliteRepositoryManager } from "../src/storage/sqlite/repositories.js";
import { SymbolSearch } from "../src/core/retrieval/symbol-search.js";
import { RelationshipSearch } from "../src/core/retrieval/relationship-search.js";
import { ContextRanker } from "../src/core/retrieval/ranker.js";

async function runTests() {
  console.log("Starting Hybrid Retrieval Engine test suite...\n");

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codebase-ai-retrieval-test-"));
  const dbPath = path.join(tempDir, "metadata.db");

  try {
    const db = SqliteDatabase.get(dbPath);
    const repoManager = new SqliteRepositoryManager(db);
    const repo = repoManager.getOrCreateRepository("/mock/project", "mock-project");

    // 1. Setup mock files & symbols
    const fileId1 = repoManager.saveFile(repo.id, {
      relativePath: "src/services/authService.ts",
      absolutePath: "/mock/project/src/services/authService.ts",
      extension: ".ts",
      sizeBytes: 500,
      lineCount: 20,
      contentHash: "hash-1"
    });

    const fileId2 = repoManager.saveFile(repo.id, {
      relativePath: "src/hooks/useAuth.ts",
      absolutePath: "/mock/project/src/hooks/useAuth.ts",
      extension: ".ts",
      sizeBytes: 400,
      lineCount: 15,
      contentHash: "hash-2"
    });

    repoManager.saveSymbols(fileId1, [{
      id: "src/services/authService.ts#AuthService:1",
      name: "AuthService",
      kind: "class",
      filePath: "src/services/authService.ts",
      startLine: 1,
      endLine: 20,
      signature: "class AuthService",
      isExported: true,
      isDefaultExport: true
    }]);

    repoManager.saveSymbols(fileId2, [{
      id: "src/hooks/useAuth.ts#useAuth:1",
      name: "useAuth",
      kind: "react_hook",
      filePath: "src/hooks/useAuth.ts",
      startLine: 1,
      endLine: 15,
      signature: "function useAuth()",
      isExported: true,
      isDefaultExport: false
    }]);

    // Save relationships: useAuth -[CALLS]-> AuthService
    repoManager.saveRelationships(repo.id, fileId2, [{
      sourceFilePath: "src/hooks/useAuth.ts",
      sourceSymbolName: "useAuth",
      targetSymbolName: "AuthService",
      targetModule: "../services/authService",
      type: "CALLS",
      line: 5
    }]);

    // Save chunks
    repoManager.saveChunks(fileId1, [{
      id: "chunk-auth-service",
      file_id: fileId1,
      symbol_id: "src/services/authService.ts#AuthService:1",
      name: "AuthService",
      chunk_type: "class",
      start_line: 1,
      end_line: 20,
      content: "export class AuthService { login() { return true; } }",
      content_hash: "hash-c1"
    }]);

    repoManager.saveChunks(fileId2, [{
      id: "chunk-use-auth",
      file_id: fileId2,
      symbol_id: "src/hooks/useAuth.ts#useAuth:1",
      name: "useAuth",
      chunk_type: "react_hook",
      start_line: 1,
      end_line: 15,
      content: "export function useAuth() { const auth = new AuthService(); return auth; }",
      content_hash: "hash-c2"
    }]);

    // 2. Test Symbol Search
    console.log("Testing Symbol Search on query 'Where is AuthService used?'...");
    const symbolSearch = new SymbolSearch(db, repo.id);
    const symbolResults = symbolSearch.search("Where is AuthService used?");

    if (symbolResults.length === 0 || symbolResults[0].symbolName !== "AuthService") {
      throw new Error("❌ SymbolSearch failed to find AuthService chunk");
    }
    console.log(`✔ SymbolSearch found: ${symbolResults[0].symbolName}`);

    // 3. Test Graph Relationship Expansion
    console.log("Testing Relationship graph traversal...");
    const relationshipSearch = new RelationshipSearch(db, repo.id);
    const expandedResults = relationshipSearch.expandRelationships(symbolResults);

    const useAuthFound = expandedResults.find(r => r.symbolName === "useAuth");
    if (!useAuthFound) {
      throw new Error("❌ Relationship traversal failed to find caller useAuth from AuthService");
    }
    console.log(`✔ Relationship traversal expanded caller: ${useAuthFound.symbolName}`);

    // 4. Test Context Ranker
    console.log("Testing ContextRanker scoring and token budgeting...");
    const rankedContext = ContextRanker.rankAndAssemble([symbolResults, expandedResults], 10000);

    if (rankedContext.totalChunksCount !== 2) {
      throw new Error(`❌ Expected 2 ranked chunks, got ${rankedContext.totalChunksCount}`);
    }
    if (!rankedContext.assembledContextText.includes("AuthService") || !rankedContext.assembledContextText.includes("useAuth")) {
      throw new Error("❌ Assembled context missing code snippets");
    }
    console.log(`✔ ContextRanker assembled ${rankedContext.totalChunksCount} chunks (${rankedContext.totalCharacters} chars) accurately.`);

    SqliteDatabase.close(dbPath);
    console.log("\n🎉 All Phase 8 Hybrid Retrieval tests passed successfully!");
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
