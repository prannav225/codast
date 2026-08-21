import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import path from "node:path";
import chalk from "chalk";
import ora from "ora";
import Database from "better-sqlite3";
import { ConfigManager } from "../../config/config-manager.js";
import { SqliteDatabase } from "../../storage/sqlite/db.js";
import { SqliteRepositoryManager } from "../../storage/sqlite/repositories.js";
import { LanceVectorStore } from "../../storage/vector/lance-store.js";
import { GeminiProvider } from "../../core/ai/gemini-provider.js";
import { createEmbeddingProvider } from "../../core/ai/ai-service.js";
import { RetrievalEngine } from "../../core/retrieval/retrieval-engine.js";
import { IndexingPipeline } from "../../core/indexing/pipeline.js";
import { TerminalUI } from "../../utils/ui.js";
import { Logger } from "../../utils/logger.js";
import { MissingApiKeyError } from "../../utils/errors.js";

export async function chatCommand(): Promise<void> {
  const cwd = process.cwd();
  const projectRoot = ConfigManager.findProjectRoot(cwd);
  const projectName = path.basename(projectRoot);

  // 1. Auto-initialize if not already initialized
  if (!ConfigManager.isInitialized(projectRoot)) {
    ConfigManager.init(projectRoot);
  }

  const config = ConfigManager.loadConfig(projectRoot);
  const geminiKey = ConfigManager.getApiKey(projectRoot);

  if (!geminiKey) {
    Logger.error(
      "Gemini API key is not configured.\nPlease run:\n  cai config set api-key <YOUR_GEMINI_KEY>"
    );
    process.exitCode = 1;
    return;
  }

  const dbPath = ConfigManager.getMetadataDbPath(projectRoot);
  const vectorsDir = ConfigManager.getVectorsDirPath(projectRoot);
  const db = SqliteDatabase.get(dbPath);
  const repoManager = new SqliteRepositoryManager(db);
  const repo = repoManager.getOrCreateRepository(projectRoot, projectName);

  // 2. Check if repository is indexed, auto-index if fresh
  let stats = repoManager.getProjectStats(repo.id);
  if (repo.status !== "INDEXED" || stats.chunkCount === 0) {
    console.log(chalk.cyan(`\n⚡ Indexing repository ${chalk.bold(projectName)} before starting chat...\n`));
    const initSpinner = ora({
      text: "Scanning files, extracting AST symbols, and generating embeddings...",
      discardStdin: false
    }).start();

    try {
      const pipeline = new IndexingPipeline(projectRoot);
      await pipeline.run({
        onProgress: (stage, detail) => {
          initSpinner.text = `${stage}${detail ? ` (${detail})` : ""}`;
        }
      });
      initSpinner.succeed(chalk.green("Repository indexed successfully!"));
      stats = repoManager.getProjectStats(repo.id);
    } catch (err: any) {
      initSpinner.warn(chalk.yellow(`Indexing partially completed: ${err.message}`));
      stats = repoManager.getProjectStats(repo.id);
    }
  }

  // 3. Render Header Banner
  TerminalUI.renderBanner(projectName, {
    files: stats.fileCount,
    symbols: stats.symbolCount,
    chunks: stats.chunkCount
  });

  // 4. Initialize AI services
  const embeddingProvider = createEmbeddingProvider(projectRoot);
  const aiProvider = new GeminiProvider(geminiKey, { chatModel: config.chatModel });
  const vectorStore = new LanceVectorStore(vectorsDir);
  await vectorStore.initialize();
  const retrievalEngine = new RetrievalEngine(db, repo.id, vectorStore, embeddingProvider);

  // 5. Start Interactive Readline Loop with robust stdin preservation
  const rl = readline.createInterface({
    input,
    output,
    terminal: true
  });

  // Handle Ctrl+C gracefully
  rl.on("SIGINT", () => {
    console.log(chalk.hex("#00E5FF")("\n\n👋 Have a productive day, Sir!\n"));
    process.exit(0);
  });

  try {
    while (true) {
      const promptString = TerminalUI.getPrompt(projectName);
      let answer: string;

      try {
        answer = await rl.question(promptString);
      } catch {
        // EOF or stream closed
        break;
      }

      if (answer === null || answer === undefined) {
        break;
      }

      const query = answer.trim();
      if (!query) continue;

      // Handle Slash Commands
      const lower = query.toLowerCase();

      if (lower === "/exit" || lower === "/quit" || lower === "exit" || lower === "quit") {
        console.log(chalk.hex("#00E5FF")("\n👋 Have a productive day, Sir!\n"));
        break;
      }

      if (lower === "/help") {
        TerminalUI.renderHelp();
        continue;
      }

      if (lower === "/clear") {
        const freshStats = repoManager.getProjectStats(repo.id);
        TerminalUI.renderBanner(projectName, {
          files: freshStats.fileCount,
          symbols: freshStats.symbolCount,
          chunks: freshStats.chunkCount
        });
        continue;
      }

      if (lower === "/status") {
        const freshStats = repoManager.getProjectStats(repo.id);
        console.log(`\n  ${chalk.bold("Repository:")}  ${chalk.cyan(projectName)}`);
        console.log(`  ${chalk.bold("Path:")}        ${chalk.dim(projectRoot)}`);
        console.log(`  ${chalk.bold("Files:")}       ${chalk.cyan(freshStats.fileCount)}`);
        console.log(`  ${chalk.bold("Symbols:")}     ${chalk.cyan(freshStats.symbolCount)}`);
        console.log(`  ${chalk.bold("Relations:")}   ${chalk.cyan(freshStats.relationshipCount)}`);
        console.log(`  ${chalk.bold("Chunks:")}      ${chalk.cyan(freshStats.chunkCount)}`);
        console.log(`  ${chalk.bold("Provider:")}    ${chalk.dim(config.embeddingProvider || "voyage")}`);
        console.log(`  ${chalk.bold("Chat Model:")}  ${chalk.dim(config.chatModel)}\n`);
        continue;
      }

      if (lower === "/files") {
        const files = repoManager.getAllFiles(repo.id);
        console.log(chalk.bold.cyan(`\n  📁 Indexed Files (${files.length}):`));
        for (const f of files.slice(0, 30)) {
          console.log(`    ${chalk.dim("•")} ${chalk.hex("#E2E8F0")(f.path)} ${chalk.dim(`(${f.line_count} lines)`)}`);
        }
        if (files.length > 30) {
          console.log(chalk.dim(`    ... and ${files.length - 30} more files`));
        }
        console.log();
        continue;
      }

      if (lower === "/index" || lower === "/reindex") {
        const indexSpinner = ora({
          text: "Re-indexing codebase with AST analysis & embeddings...",
          discardStdin: false
        }).start();

        try {
          const pipeline = new IndexingPipeline(projectRoot);
          await pipeline.run({
            force: true,
            onProgress: (stage, detail) => {
              indexSpinner.text = `${stage}${detail ? ` (${detail})` : ""}`;
            }
          });
          const freshStats = repoManager.getProjectStats(repo.id);
          indexSpinner.succeed(
            chalk.green(
              `Re-indexed! Files: ${freshStats.fileCount}, Symbols: ${freshStats.symbolCount}, Chunks: ${freshStats.chunkCount}`
            )
          );
        } catch (e: any) {
          indexSpinner.fail(chalk.red(`Re-index failed: ${e.message}`));
        }
        console.log();
        continue;
      }

      if (lower === "/config") {
        const voyageKey = ConfigManager.getVoyageApiKey(projectRoot);
        console.log(`\n  ${chalk.bold("Gemini Key:")}   ${geminiKey.slice(0, 4)}...${geminiKey.slice(-4)}`);
        console.log(`  ${chalk.bold("Voyage Key:")}   ${voyageKey ? `${voyageKey.slice(0, 4)}...${voyageKey.slice(-4)}` : chalk.yellow("Not set")}`);
        console.log(`  ${chalk.bold("Provider:")}     ${config.embeddingProvider || "voyage"}`);
        console.log(`  ${chalk.bold("Chat Model:")}   ${config.chatModel}`);
        console.log(`  ${chalk.bold("Embed Model:")}  ${config.embeddingModel}\n`);
        continue;
      }

      // Process Codebase Question
      const searchSpinner = ora({
        text: chalk.hex("#94A3B8")("Searching symbols, call graphs, and semantic vectors..."),
        color: "blue",
        discardStdin: false
      }).start();

      try {
        const context = await retrievalEngine.retrieveContext(query);

        if (context.totalChunksCount === 0) {
          searchSpinner.warn(chalk.yellow("No direct code matches found for this query."));
          console.log();
          continue;
        }

        searchSpinner.text = chalk.dim(`Reasoning with ${context.totalChunksCount} codebase sources...`);
        const result = await aiProvider.generateAnswer(query, context.assembledContextText);
        searchSpinner.stop();

        // Render response
        console.log(TerminalUI.formatMarkdown(result.answer));
        console.log();

        // Render citations
        if (result.sources && result.sources.length > 0) {
          TerminalUI.renderSources(result.sources);
        } else if (context.chunks.length > 0) {
          TerminalUI.renderSources(
            context.chunks.slice(0, 4).map(c => ({
              path: c.filePath,
              startLine: c.startLine,
              endLine: c.endLine
            }))
          );
        }
      } catch (err: any) {
        searchSpinner.fail(chalk.red("Failed to answer"));
        console.log(chalk.red(`  ${err.message}\n`));
      }
    }
  } finally {
    rl.close();
  }
}
