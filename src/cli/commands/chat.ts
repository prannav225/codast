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
      "Gemini API key is not configured.\nPlease run:\n  codast config set api-key <YOUR_GEMINI_KEY>"
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
    console.log(chalk.hex("#818CF8")(`\n⚡ Indexing repository ${chalk.bold(projectName)} before starting chat...\n`));
    const initSpinner = ora({
      text: "Scanning files, extracting AST symbols, and generating embeddings...",
      color: "blue",
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
  TerminalUI.renderBanner(
    projectName,
    {
      files: stats.fileCount,
      symbols: stats.symbolCount,
      chunks: stats.chunkCount
    },
    config,
    projectRoot
  );

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
    console.log(chalk.hex("#818CF8")("\n\n👋 Have a productive day, Sir!\n"));
    process.exit(0);
  });

  try {
    while (true) {
      const promptString = TerminalUI.getPrompt(projectName, projectRoot);
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
        console.log(chalk.hex("#818CF8")("\n👋 Have a productive day, Sir!\n"));
        break;
      }

      if (lower === "/help") {
        TerminalUI.renderHelp();
        continue;
      }

      if (lower === "/clear") {
        const freshStats = repoManager.getProjectStats(repo.id);
        TerminalUI.renderBanner(
          projectName,
          {
            files: freshStats.fileCount,
            symbols: freshStats.symbolCount,
            chunks: freshStats.chunkCount
          },
          config,
          projectRoot
        );
        continue;
      }

      if (lower === "/tree") {
        const files = repoManager.getAllFiles(repo.id);
        TerminalUI.renderFileTree(files.map(f => ({ path: f.path, lines: f.line_count })));
        continue;
      }

      if (lower === "/status" || lower === "/stats") {
        const freshStats = repoManager.getProjectStats(repo.id);
        const dim = chalk.hex("#475569");
        const header = chalk.hex("#818CF8").bold("◈ Codebase Status & Metrics");
        console.log(`\n  ${dim("╭─")} ${header} ${dim("─────────────────────────────────────────────────╮")}`);
        console.log(`  ${dim("│")}  ${chalk.bold("Repository:")}    ${chalk.hex("#F8FAFC")(projectName)}`);
        console.log(`  ${dim("│")}  ${chalk.bold("Root Path:")}     ${chalk.hex("#94A3B8")(projectRoot)}`);
        console.log(`  ${dim("│")}  ${chalk.bold("Source Files:")}  ${chalk.hex("#34D399").bold(freshStats.fileCount)}`);
        console.log(`  ${dim("│")}  ${chalk.bold("AST Symbols:")}   ${chalk.hex("#34D399").bold(freshStats.symbolCount)}`);
        console.log(`  ${dim("│")}  ${chalk.bold("Call Edges:")}    ${chalk.hex("#34D399").bold(freshStats.relationshipCount)}`);
        console.log(`  ${dim("│")}  ${chalk.bold("Code Chunks:")}   ${chalk.hex("#34D399").bold(freshStats.chunkCount)}`);
        console.log(`  ${dim("│")}  ${chalk.bold("Embed Provider:")}${chalk.hex("#93C5FD")(config.embeddingProvider || "voyage")}`);
        console.log(`  ${dim("│")}  ${chalk.bold("Chat Model:")}    ${chalk.hex("#93C5FD")(config.chatModel)}`);
        console.log(`  ${dim("╰──────────────────────────────────────────────────────────────────────────╯\n")}`);
        continue;
      }

      if (lower === "/files") {
        const files = repoManager.getAllFiles(repo.id);
        console.log(chalk.bold.hex("#818CF8")(`\n  📁 Indexed Source Files (${files.length}):`));
        for (const f of files.slice(0, 30)) {
          console.log(`    ${chalk.hex("#475569")("•")} ${chalk.hex("#E2E8F0")(f.path)} ${chalk.hex("#64748B")(`(${f.line_count} lines)`)}`);
        }
        if (files.length > 30) {
          console.log(chalk.hex("#64748B")(`    ... and ${files.length - 30} more files`));
        }
        console.log();
        continue;
      }

      if (lower === "/index" || lower === "/reindex") {
        const indexSpinner = ora({
          text: "Re-indexing codebase with AST analysis & embeddings...",
          color: "blue",
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
            chalk.hex("#34D399")(
              `Re-indexed! Files: ${freshStats.fileCount}, Symbols: ${freshStats.symbolCount}, Chunks: ${freshStats.chunkCount}`
            )
          );
        } catch (e: any) {
          indexSpinner.fail(chalk.red(`Re-index failed: ${e.message}`));
        }
        console.log();
        continue;
      }

      if (lower === "/config" || lower === "/model") {
        const voyageKey = ConfigManager.getVoyageApiKey(projectRoot);
        console.log(`\n  ${chalk.bold("Gemini Key:")}   ${geminiKey.slice(0, 4)}...${geminiKey.slice(-4)}`);
        console.log(`  ${chalk.bold("Voyage Key:")}   ${voyageKey ? `${voyageKey.slice(0, 4)}...${voyageKey.slice(-4)}` : chalk.yellow("Not set")}`);
        console.log(`  ${chalk.bold("Provider:")}     ${config.embeddingProvider || "voyage"}`);
        console.log(`  ${chalk.bold("Chat Model:")}   ${config.chatModel}`);
        console.log(`  ${chalk.bold("Embed Model:")}  ${config.embeddingModel}\n`);
        continue;
      }

      // Process Codebase Question with Live Stepper & Real-time Streaming
      const retrievalStart = Date.now();
      console.log();
      TerminalUI.renderPipelineStep(1, 3, "Resolving AST Symbols & Call Graphs", "Querying local SQLite schema...");

      try {
        const context = await retrievalEngine.retrieveContext(query);
        const retrievalDurationMs = Date.now() - retrievalStart;

        TerminalUI.renderPipelineStep(2, 3, "LanceDB Semantic Vector Ranking", `${context.chunks.length} candidate code chunks`, true);
        TerminalUI.renderPipelineStep(3, 3, "Multi-Hop Relational Context Assembly", `${context.totalChunksCount} chunks (${context.tokenEstimate} estimated tokens)`, true);

        if (context.totalChunksCount === 0) {
          console.log(chalk.yellow("\n  ⚠ No relevant code matches found for this query in the index.\n"));
          continue;
        }

        console.log(`\n  ${chalk.hex("#818CF8").bold("◈ Response:")}\n`);

        const streamStart = Date.now();
        let accumulatedRawAnswer = "";

        // Stream answer tokens in real-time
        const result = await aiProvider.generateAnswerStream(
          query,
          context.assembledContextText,
          (tokenChunk: string) => {
            process.stdout.write(tokenChunk);
            accumulatedRawAnswer += tokenChunk;
          }
        );

        const streamDurationMs = Date.now() - streamStart;
        console.log();

        // Resolve citations
        const resolvedSources =
          result.sources && result.sources.length > 0
            ? result.sources
            : context.chunks.slice(0, 5).map(c => ({
                path: c.filePath,
                startLine: c.startLine,
                endLine: c.endLine
              }));

        // Render OSC-8 Clickable Sources & Performance Latency Footer
        TerminalUI.renderSources(resolvedSources, projectRoot);
        TerminalUI.renderLatencyFooter(retrievalDurationMs, streamDurationMs, resolvedSources.length);
      } catch (err: any) {
        console.log(chalk.red(`\n  ✖ Error: ${err.message}\n`));
      }
    }
  } finally {
    rl.close();
  }
}
