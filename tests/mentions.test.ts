import assert from "node:assert";
import Database from "better-sqlite3";
import { SCHEMA_SQL } from "../src/storage/sqlite/schema.js";
import { MentionResolver } from "../src/core/retrieval/mention-resolver.js";
import { SqliteRepositoryManager } from "../src/storage/sqlite/repositories.js";

console.log("\nStarting @-Mention Resolution test suite...\n");

const db = new Database(":memory:");
db.exec(SCHEMA_SQL);

const repoManager = new SqliteRepositoryManager(db);
const repo = repoManager.getOrCreateRepository(process.cwd(), "test-repo");

const fileId = repoManager.saveFile(repo.id, {
  absolutePath: "/path/to/src/services/auth.ts",
  relativePath: "src/services/auth.ts",
  extension: ".ts",
  sizeBytes: 500,
  lineCount: 30,
  contentHash: "hash123"
});

repoManager.saveSymbols(fileId, [
  {
    id: "sym-1",
    name: "AuthService",
    kind: "class",
    filePath: "src/services/auth.ts",
    startLine: 5,
    endLine: 25,
    signature: "class AuthService",
    isExported: true,
    isDefaultExport: false
  },
  {
    id: "sym-2",
    name: "login",
    kind: "method",
    filePath: "src/services/auth.ts",
    startLine: 10,
    endLine: 18,
    signature: "login(creds)",
    isExported: false,
    isDefaultExport: false
  }
]);

const resolver = new MentionResolver(db, repo.id, process.cwd());

// 1. Test symbol mention resolution
const resSymbol = resolver.resolveMentions("Explain how @AuthService handles authentication.");
assert.strictEqual(resSymbol.chunks.length, 1, "Should resolve @AuthService symbol");
assert.strictEqual(resSymbol.chunks[0].symbolName, "AuthService");
assert.strictEqual(resSymbol.chunks[0].score, 95.0, "Symbol mentions should have top priority score");
console.log("✔ @Symbol mention resolution verified.");

// 2. Test file mention resolution
const resFile = resolver.resolveMentions("What is in @src/services/auth.ts:1-20?");
assert.strictEqual(resFile.chunks.length, 1, "Should identify @file mention");
assert.strictEqual(resFile.chunks[0].filePath, "src/services/auth.ts");
assert.strictEqual(resFile.chunks[0].score, 100.0, "File mentions should have top priority score");
console.log("✔ @File mention resolution with line range verified.");

console.log("\n🎉 All @-Mention Resolution tests passed successfully!\n");
