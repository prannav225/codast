import assert from "node:assert";
import Database from "better-sqlite3";
import { SCHEMA_SQL } from "../src/storage/sqlite/schema.js";
import { DiagramGenerator } from "../src/core/analysis/diagram-generator.js";
import { SqliteRepositoryManager } from "../src/storage/sqlite/repositories.js";

console.log("\nStarting Architecture & Sequence Diagram test suite...\n");

const db = new Database(":memory:");
db.exec(SCHEMA_SQL);

const repoManager = new SqliteRepositoryManager(db);
const repo = repoManager.getOrCreateRepository(process.cwd(), "test-diagram-repo");

const f1 = repoManager.saveFile(repo.id, {
  absolutePath: "/path/to/src/services/auth.ts",
  relativePath: "src/services/auth.ts",
  extension: ".ts",
  sizeBytes: 400,
  lineCount: 20,
  contentHash: "h1"
});

const f2 = repoManager.saveFile(repo.id, {
  absolutePath: "/path/to/src/db/sqlite.ts",
  relativePath: "src/db/sqlite.ts",
  extension: ".ts",
  sizeBytes: 300,
  lineCount: 15,
  contentHash: "h2"
});

repoManager.saveRelationships(repo.id, f1, [
  { sourceFilePath: "src/services/auth.ts", targetModule: "src/db/sqlite.ts", type: "IMPORTS", line: 1 },
  { sourceFilePath: "src/services/auth.ts", sourceSymbolName: "AuthService.login", targetSymbolName: "SqliteDatabase.query", type: "CALLS", line: 12 }
]);

const generator = new DiagramGenerator(db, repo.id);

// 1. Architecture Mermaid
const mermaidArch = generator.generateArchitectureMermaid();
assert.ok(mermaidArch.includes("graph TD"), "Architecture should generate graph TD");
assert.ok(mermaidArch.includes("auth_ts"), "Architecture graph should contain node for auth.ts");
assert.ok(mermaidArch.includes("sqlite_ts"), "Architecture graph should contain node for sqlite.ts");
console.log("✔ Mermaid architecture graph generation verified.");

// 2. Call flow Mermaid
const mermaidFlow = generator.generateCallFlowMermaid();
assert.ok(mermaidFlow.includes("sequenceDiagram"), "Call flow should generate sequenceDiagram");
assert.ok(mermaidFlow.includes("login->>query"), "Sequence diagram should trace login -> query invocation");
console.log("✔ Mermaid sequence call flow diagram verified.");

// 3. ASCII component flow
const asciiFlow = generator.generateAsciiFlow();
assert.ok(asciiFlow.includes("[ auth.ts ]"), "ASCII flow should contain component box");
console.log("✔ ASCII flow diagram verified.");

console.log("\n🎉 All Architecture & Sequence Diagram tests passed successfully!\n");
