import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { RepositoryScanner } from "../src/core/scanner/scanner.js";
import { FileFilter } from "../src/core/scanner/filters.js";

async function runTests() {
  console.log("Starting Repository Scanner test suite...\n");

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codebase-ai-scanner-test-"));

  try {
    // 1. Create simulated directory structure
    fs.mkdirSync(path.join(tempDir, "src/components"), { recursive: true });
    fs.mkdirSync(path.join(tempDir, "src/utils"), { recursive: true });
    fs.mkdirSync(path.join(tempDir, "pkg/auth"), { recursive: true });
    fs.mkdirSync(path.join(tempDir, "node_modules/pkg"), { recursive: true });
    fs.mkdirSync(path.join(tempDir, "dist"), { recursive: true });
    fs.mkdirSync(path.join(tempDir, ".codebase-ai"), { recursive: true });

    // Valid multi-language files
    fs.writeFileSync(path.join(tempDir, "src/index.ts"), "export const hello = 'world';\nconsole.log(hello);\n");
    fs.writeFileSync(path.join(tempDir, "src/components/Button.tsx"), "import React from 'react';\nexport const Button = () => <button>Click</button>;\n");
    fs.writeFileSync(path.join(tempDir, "src/utils/math.js"), "export function add(a, b) {\n  return a + b;\n}\n");
    fs.writeFileSync(path.join(tempDir, "src/utils/view.jsx"), "export function View() {\n  return <div>View</div>;\n}\n");
    fs.writeFileSync(path.join(tempDir, "src/utils/helper.py"), "def help():\n    pass\n");
    fs.writeFileSync(path.join(tempDir, "pkg/auth/service.go"), "package auth\n");

    // Ignored/Excluded files
    fs.writeFileSync(path.join(tempDir, "node_modules/pkg/index.js"), "module.exports = {};");
    fs.writeFileSync(path.join(tempDir, "dist/bundle.js"), "var a=1;");
    fs.writeFileSync(path.join(tempDir, ".env"), "SECRET_KEY=12345");
    fs.writeFileSync(path.join(tempDir, ".env.local"), "LOCAL_SECRET=abc");
    fs.writeFileSync(path.join(tempDir, "src/utils/test.min.js"), "var min=1;");
    fs.writeFileSync(path.join(tempDir, ".gitignore"), "ignored-dir/\ncustom-ignored.ts\n");

    // Custom gitignored files
    fs.mkdirSync(path.join(tempDir, "ignored-dir"), { recursive: true });
    fs.writeFileSync(path.join(tempDir, "ignored-dir/file.ts"), "export const x = 1;");
    fs.writeFileSync(path.join(tempDir, "src/custom-ignored.ts"), "export const y = 2;");

    // 2. Run Scanner
    const scanner = new RepositoryScanner(tempDir);
    const result = await scanner.scan();

    console.log(`Discovered ${result.totalFiles} files, ${result.totalLines} lines, ${result.totalBytes} bytes`);

    // 3. Assertions
    const expectedFiles = [
      "pkg/auth/service.go",
      "src/components/Button.tsx",
      "src/index.ts",
      "src/utils/helper.py",
      "src/utils/math.js",
      "src/utils/view.jsx"
    ];

    const discoveredRelativePaths = result.files.map(f => f.relativePath);

    let failed = false;

    // Check count
    if (result.totalFiles !== expectedFiles.length) {
      console.error(`❌ Expected ${expectedFiles.length} files, found ${result.totalFiles}:`, discoveredRelativePaths);
      failed = true;
    } else {
      console.log(`✔ Exactly ${expectedFiles.length} valid source files discovered.`);
    }

    // Check paths
    for (const expected of expectedFiles) {
      if (!discoveredRelativePaths.includes(expected)) {
        console.error(`❌ Missing expected file: ${expected}`);
        failed = true;
      }
    }

    // Check that excluded files were NOT discovered
    const shouldNotContain = [
      "node_modules/pkg/index.js",
      "dist/bundle.js",
      ".env",
      ".env.local",
      "src/utils/test.min.js",
      "ignored-dir/file.ts",
      "src/custom-ignored.ts"
    ];

    for (const excluded of shouldNotContain) {
      if (discoveredRelativePaths.includes(excluded)) {
        console.error(`❌ Found excluded file: ${excluded}`);
        failed = true;
      }
    }

    // Check hashes and lines
    const indexFile = result.files.find(f => f.relativePath === "src/index.ts");
    if (!indexFile || indexFile.lineCount !== 3 || !indexFile.contentHash) {
      console.error(`❌ Line count or hash mismatch for src/index.ts:`, indexFile);
      failed = true;
    } else {
      console.log(`✔ Hashes and line counts verified accurately.`);
    }

    if (!failed) {
      console.log("\n🎉 All Phase 2 Repository Scanner tests passed successfully!");
    } else {
      process.exit(1);
    }
  } finally {
    // Cleanup temporary directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
