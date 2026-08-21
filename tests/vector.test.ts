import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { LanceVectorStore } from "../src/storage/vector/lance-store.js";

async function runTests() {
  console.log("Starting LanceDB Vector Store test suite...\n");

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codebase-ai-vector-test-"));
  const vectorsDir = path.join(tempDir, "vectors");

  try {
    const store = new LanceVectorStore(vectorsDir);
    await store.initialize();

    // 1. Create simulated vector embeddings (dimensions: 4 for unit testing)
    console.log("Testing LanceDB batch chunk insertion...");
    await store.upsertChunks([
      {
        id: "chunk-auth-login",
        vector: [0.9, 0.1, 0.0, 0.0],
        filePath: "src/services/authService.ts",
        symbolName: "AuthService.login",
        chunkType: "method",
        startLine: 10,
        endLine: 25,
        content: "async login(creds) { ... }",
        contentHash: "hash-1"
      },
      {
        id: "chunk-user-profile",
        vector: [0.0, 0.8, 0.6, 0.0],
        filePath: "src/components/UserProfile.tsx",
        symbolName: "UserProfile",
        chunkType: "react_component",
        startLine: 1,
        endLine: 30,
        content: "export const UserProfile = () => { ... }",
        contentHash: "hash-2"
      }
    ]);
    console.log("✔ Vector records inserted successfully.");

    // 2. Perform vector search matching 'chunk-auth-login' query
    console.log("Testing vector similarity search...");
    const queryVector = [0.85, 0.15, 0.0, 0.0];
    const searchResults = await store.search(queryVector, 2);

    console.log(`Retrieved ${searchResults.length} search results:`);
    for (const res of searchResults) {
      console.log(`  - [Score: ${res.score.toFixed(4)}] ${res.symbolName} (${res.filePath}:${res.startLine})`);
    }

    if (searchResults.length !== 2) {
      throw new Error(`❌ Expected 2 search results, got ${searchResults.length}`);
    }

    if (searchResults[0].id !== "chunk-auth-login") {
      throw new Error(`❌ Expected 'chunk-auth-login' to be top result, got: ${searchResults[0].id}`);
    }
    console.log("✔ Top-1 vector match verified.");

    // 3. Clear store
    await store.clear();
    const afterClear = await store.search(queryVector, 2);
    if (afterClear.length !== 0) {
      throw new Error(`❌ Expected 0 results after clear, got ${afterClear.length}`);
    }
    console.log("✔ Vector store drop/clear verified.");

    console.log("\n🎉 All Phase 6 Vector Storage tests passed successfully!");
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
