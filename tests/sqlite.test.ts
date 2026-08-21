import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { SqliteDatabase } from "../src/storage/sqlite/db.js";
import { SqliteRepositoryManager } from "../src/storage/sqlite/repositories.js";

async function runTests() {
  console.log("Starting SQLite Structured Storage test suite...\n");

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codebase-ai-sqlite-test-"));
  const dbPath = path.join(tempDir, "metadata.db");

  try {
    const db = SqliteDatabase.get(dbPath);
    const repoManager = new SqliteRepositoryManager(db);

    // 1. Create Repository
    console.log("Testing Repository record creation...");
    const repo = repoManager.getOrCreateRepository("/mock/project", "mock-project");
    if (!repo.id || repo.name !== "mock-project") {
      throw new Error("❌ Failed to create repository record");
    }
    console.log(`✔ Repository created with ID: ${repo.id}`);

    // 2. Save File
    console.log("Testing File persistence...");
    const fileId = repoManager.saveFile(repo.id, {
      relativePath: "src/services/authService.ts",
      absolutePath: "/mock/project/src/services/authService.ts",
      extension: ".ts",
      sizeBytes: 1024,
      lineCount: 45,
      contentHash: "hash-auth-12345"
    });
    if (!fileId) {
      throw new Error("❌ Failed to save file record");
    }
    console.log(`✔ File persisted with ID: ${fileId}`);

    // 3. Save Symbols
    console.log("Testing Symbol persistence...");
    repoManager.saveSymbols(fileId, [
      {
        id: "src/services/authService.ts#AuthService:5",
        name: "AuthService",
        kind: "class",
        filePath: "src/services/authService.ts",
        startLine: 5,
        endLine: 40,
        signature: "class AuthService",
        docComment: "/** Authentication service */",
        isExported: true,
        isDefaultExport: false
      },
      {
        id: "src/services/authService.ts#AuthService.login:10",
        name: "AuthService.login",
        kind: "method",
        filePath: "src/services/authService.ts",
        startLine: 10,
        endLine: 25,
        signature: "AuthService.login(creds): Promise<User>",
        isExported: false,
        isDefaultExport: false
      }
    ]);

    const foundSymbols = repoManager.findSymbolsByName(repo.id, "AuthService");
    if (foundSymbols.length !== 2) {
      throw new Error(`❌ Expected 2 symbols, found ${foundSymbols.length}`);
    }
    console.log(`✔ Symbols saved and queried successfully (${foundSymbols.length} found).`);

    // 4. Save Relationships
    console.log("Testing Relationship persistence...");
    repoManager.saveRelationships(repo.id, fileId, [
      {
        sourceFilePath: "src/services/authService.ts",
        sourceSymbolName: "AuthService.login",
        targetSymbolName: "apiClient.post",
        targetModule: "./apiClient",
        type: "CALLS",
        line: 12
      }
    ]);

    const foundRels = repoManager.findRelationshipsForSymbol(repo.id, "AuthService.login");
    if (foundRels.length !== 1 || foundRels[0].type !== "CALLS") {
      throw new Error("❌ Relationship for symbol not retrieved properly");
    }
    console.log(`✔ Relationships saved and queried successfully.`);

    // 5. Save Chunks
    console.log("Testing Chunk persistence...");
    repoManager.saveChunks(fileId, [
      {
        id: "chunk-1",
        file_id: fileId,
        symbol_id: "src/services/authService.ts#AuthService.login:10",
        name: "AuthService.login",
        chunk_type: "method",
        start_line: 10,
        end_line: 25,
        content: "async login(creds) { return apiClient.post('/login', creds); }",
        content_hash: "hash-chunk-1"
      }
    ]);

    const allChunks = repoManager.getAllChunks(repo.id);
    if (allChunks.length !== 1) {
      throw new Error(`❌ Expected 1 chunk, found ${allChunks.length}`);
    }
    console.log(`✔ Chunks persisted and retrieved successfully.`);

    // 6. Statistics Check
    const stats = repoManager.getProjectStats(repo.id);
    if (
      stats.fileCount !== 1 ||
      stats.symbolCount !== 2 ||
      stats.relationshipCount !== 1 ||
      stats.chunkCount !== 1
    ) {
      throw new Error(`❌ Stats mismatch: ${JSON.stringify(stats)}`);
    }
    console.log(`✔ Project statistics accurate:`, stats);

    // Update repo status
    repoManager.updateRepositoryStatus(repo.id, "INDEXED");
    console.log("✔ Repository status updated to INDEXED.");

    SqliteDatabase.close(dbPath);
    console.log("\n🎉 All Phase 4 SQLite Structured Storage tests passed successfully!");
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
