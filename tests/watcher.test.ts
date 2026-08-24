import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { IndexingPipeline } from "../src/core/indexing/pipeline.js";
import { SqliteDatabase } from "../src/storage/sqlite/db.js";
import { SqliteRepositoryManager } from "../src/storage/sqlite/repositories.js";
import { ConfigManager } from "../src/config/config-manager.js";

console.log("\nStarting Real-Time Incremental Indexing & Watcher test suite...\n");

async function runWatcherTests() {
  const tempDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "codast-watcher-test-")));
  ConfigManager.init(tempDir);

  const testFile = path.join(tempDir, "sample.ts");
  fs.writeFileSync(testFile, "export class AuthManager { login() { return true; } }", "utf8");

  const dbPath = ConfigManager.getMetadataDbPath(tempDir);
  const db = SqliteDatabase.get(dbPath);
  const repoManager = new SqliteRepositoryManager(db);
  const repo = repoManager.getOrCreateRepository(tempDir, path.basename(tempDir));

  // 1. Test Single File Incremental Indexing
  const pipeline = new IndexingPipeline(tempDir);
  const result1 = await pipeline.indexSingleFile("sample.ts");

  assert.strictEqual(result1.symbolCount, 2, "Should extract AuthManager and login symbols");
  assert.ok(result1.chunkCount >= 1, "Should generate chunks for sample.ts");
  console.log("✔ Incremental single file indexing verified.");

  // 2. Test File Modification with New Symbol
  fs.appendFileSync(testFile, "\nexport class SessionHandler { verify() { return 1; } }", "utf8");
  const result2 = await pipeline.indexSingleFile("sample.ts");

  assert.strictEqual(result2.symbolCount, 4, "Should extract 4 symbols after edit");
  const symbols = repoManager.findSymbolsByName(repo.id, "SessionHandler");
  assert.ok(symbols.length >= 1, "New symbol SessionHandler should be stored in SQLite");
  console.log("✔ Incremental symbol update on edit verified.");

  // 3. Test File Removal
  await pipeline.removeFile("sample.ts");
  const remainingSymbols = repoManager.findSymbolsByName(repo.id, "AuthManager");
  assert.strictEqual(remainingSymbols.length, 0, "Symbols should be removed when file is deleted");
  console.log("✔ File removal & cleanup verified.");

  // Cleanup
  SqliteDatabase.close(dbPath);
  fs.rmSync(tempDir, { recursive: true, force: true });

  console.log("\n🎉 All Background & Incremental Indexing tests passed successfully!\n");
}

runWatcherTests().catch(err => {
  console.error("Watcher test failed:", err);
  process.exit(1);
});
