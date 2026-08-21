import { AstParser } from "../src/core/analysis/ast-parser.js";
import { LogicalChunker } from "../src/core/analysis/chunker.js";

async function runTests() {
  console.log("Starting Logical Code Chunker test suite...\n");

  const parser = new AstParser("/test/project");

  // 1. Sample file with imports, class, hook, component, and bottom module export
  const fileContent = `import React, { useState } from 'react';
import { apiClient } from './apiClient';

export const API_URL = "https://api.example.com";

export function useAuth() {
  const [user, setUser] = useState(null);
  return { user };
}

export class AuthService {
  async login(creds: any) {
    return apiClient.post('/login', creds);
  }
}

export const LoginPage: React.FC = () => {
  return <div>Login</div>;
};

console.log("Module loaded");
`;

  const parsed = parser.parseSourceFile("src/features/auth.tsx", fileContent);
  const chunks = LogicalChunker.chunkFile("src/features/auth.tsx", fileContent, parsed.symbols);

  console.log(`Generated ${chunks.length} logical chunks:`);
  for (const chunk of chunks) {
    console.log(`  - [${chunk.chunkType}] ${chunk.name} (Lines ${chunk.startLine}-${chunk.endLine}) [${chunk.contentHash.slice(0, 8)}]`);
  }

  // Assertions
  const hookChunk = chunks.find(c => c.name === "useAuth");
  if (!hookChunk || hookChunk.chunkType !== "react_hook") {
    throw new Error("❌ useAuth chunk missing or incorrect type");
  }

  const classChunk = chunks.find(c => c.name === "AuthService");
  if (!classChunk || classChunk.chunkType !== "class") {
    throw new Error("❌ AuthService chunk missing or incorrect type");
  }

  const componentChunk = chunks.find(c => c.name === "LoginPage");
  if (!componentChunk || componentChunk.chunkType !== "react_component") {
    throw new Error("❌ LoginPage component chunk missing");
  }

  const topModuleChunk = chunks.find(c => c.chunkType === "module" && c.startLine === 1);
  if (!topModuleChunk || !topModuleChunk.content.includes("API_URL")) {
    throw new Error("❌ Top module gap with imports/constants was not captured");
  }

  // Verify enrichment
  if (!hookChunk.enrichedContent.includes("// File: src/features/auth.tsx") || !hookChunk.enrichedContent.includes("// Symbol: useAuth")) {
    throw new Error("❌ Enriched chunk metadata header missing");
  }
  console.log("✔ AST boundaries and enriched headers verified.");

  // 2. Test large function secondary window splitting
  const largeLines: string[] = [];
  largeLines.push("function processMassiveData() {");
  for (let i = 1; i <= 250; i++) {
    largeLines.push(`  const step_${i} = ${i} * 2;`);
  }
  largeLines.push("  return true;");
  largeLines.push("}");
  const largeContent = largeLines.join("\n");

  const largeParsed = parser.parseSourceFile("src/utils/massive.ts", largeContent);
  const largeChunks = LogicalChunker.chunkFile("src/utils/massive.ts", largeContent, largeParsed.symbols, {
    maxChunkLines: 100,
    chunkOverlapLines: 20
  });

  console.log(`\nTesting oversized function (253 lines): produced ${largeChunks.length} partitioned chunks:`);
  for (const c of largeChunks) {
    console.log(`  - ${c.name} (Lines ${c.startLine}-${c.endLine})`);
  }

  if (largeChunks.length < 3) {
    throw new Error(`❌ Expected at least 3 parts for 253-line function, got ${largeChunks.length}`);
  }
  console.log("✔ Secondary sliding window chunking for large symbols verified.");

  console.log("\n🎉 All Phase 5 Logical Code Chunking tests passed successfully!");
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
