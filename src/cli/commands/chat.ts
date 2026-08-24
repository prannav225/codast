import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import path from "node:path";
import chalk from "chalk";
import ora from "ora";
import { ConfigManager } from "../../config/config-manager.js";
import { SqliteDatabase } from "../../storage/sqlite/db.js";
import { SqliteRepositoryManager } from "../../storage/sqlite/repositories.js";
import { LanceVectorStore } from "../../storage/vector/lance-store.js";
import { GeminiProvider } from "../../core/ai/gemini-provider.js";
import { createEmbeddingProvider } from "../../core/ai/ai-service.js";
import { RetrievalEngine } from "../../core/retrieval/retrieval-engine.js";
import { IndexingPipeline } from "../../core/indexing/pipeline.js";
import { TerminalUI, PIXEL_SPINNER } from "../../utils/ui.js";
import { Logger } from "../../utils/logger.js";

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

  // 2. Auto-index if not indexed
  let stats = repoManager.getProjectStats(repo.id);
  if (repo.status !== "INDEXED" || stats.chunkCount === 0) {
    console.log(chalk.hex("#82AAFF")(`\n⚡ Indexing ${chalk.bold(projectName)}...\n`));
    const initSpinner = ora({
      spinner: PIXEL_SPINNER,
      text: chalk.hex("#EEFFFF")("Scanning files, extracting AST symbols, and generating embeddings..."),
      discardStdin: false
    }).start();

    try {
      const pipeline = new IndexingPipeline(projectRoot);
      await pipeline.run({
        onProgress: (stage, detail) => {
          initSpinner.text = chalk.hex("#EEFFFF")(`${stage}${detail ? ` (${detail})` : ""}`);
        }
      });
      initSpinner.succeed(chalk.hex("#C3E88D")("Repository indexed successfully!"));
      stats = repoManager.getProjectStats(repo.id);
    } catch (err: any) {
      initSpinner.warn(chalk.yellow(`Indexing partially completed: ${err.message}`));
      stats = repoManager.getProjectStats(repo.id);
    }
  }

  // 3. Render Antigravity Pixel Header
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

  // 5. Interactive Readline Interface
  const rl = readline.createInterface({
    input,
    output,
    terminal: true
  });

  rl.on("SIGINT", () => {
    console.log(chalk.hex("#89DDFF")("\n\n👋 Have a productive day, Sir!\n"));
    process.exit(0);
  });

  try {
    while (true) {
      const promptString = TerminalUI.getPrompt();
      let answer: string;

      try {
        answer = await rl.question(promptString);
      } catch {
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
        console.log(chalk.hex("#89DDFF")("\n👋 Have a productive day, Sir!\n"));
        break;
      }

      if (lower === "/help" || lower === "?") {
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
        const rule = chalk.hex("#3B4261");
        console.log(`\n  ${chalk.hex("#82AAFF").bold("Codast Repository Status:")}`);
        console.log(`  ${rule("─────────────────────────────────────────")}`);
        console.log(`  ${chalk.hex("#EEFFFF")("Repository:")}     ${projectName}`);
        console.log(`  ${chalk.hex("#EEFFFF")("Root Path:")}      ${chalk.hex("#676E95")(projectRoot)}`);
        console.log(`  ${chalk.hex("#EEFFFF")("Source Files:")}   ${chalk.hex("#C3E88D")(freshStats.fileCount)}`);
        console.log(`  ${chalk.hex("#EEFFFF")("AST Symbols:")}    ${chalk.hex("#C3E88D")(freshStats.symbolCount)}`);
        console.log(`  ${chalk.hex("#EEFFFF")("Call Edges:")}     ${chalk.hex("#C3E88D")(freshStats.relationshipCount)}`);
        console.log(`  ${chalk.hex("#EEFFFF")("Code Chunks:")}    ${chalk.hex("#C3E88D")(freshStats.chunkCount)}`);
        console.log(`  ${chalk.hex("#EEFFFF")("Embedding:")}      ${chalk.hex("#89DDFF")(`${config.embeddingProvider || "voyage"}:${config.embeddingModel || "voyage-code-2"}`)}`);
        console.log(`  ${chalk.hex("#EEFFFF")("Chat Model:")}     ${chalk.hex("#89DDFF")(config.chatModel || "gemini-3.1-flash-lite")}`);
        console.log(`  ${rule("─────────────────────────────────────────")}\n`);
        continue;
      }

      if (lower === "/files") {
        const files = repoManager.getAllFiles(repo.id);
        console.log(chalk.bold.hex("#82AAFF")(`\n  Indexed Files (${files.length}):`));
        for (const f of files.slice(0, 30)) {
          console.log(`    ${chalk.hex("#FFCB6B")("●")} ${chalk.hex("#EEFFFF")(f.path)} ${chalk.hex("#676E95")(`(${f.line_count} lines)`)}`);
        }
        if (files.length > 30) {
          console.log(chalk.hex("#676E95")(`    ... and ${files.length - 30} more files`));
        }
        console.log();
        continue;
      }

      if (lower === "/index" || lower === "/reindex") {
        const indexSpinner = ora({
          spinner: PIXEL_SPINNER,
          text: chalk.hex("#EEFFFF")("Re-indexing codebase..."),
          discardStdin: false
        }).start();

        try {
          const pipeline = new IndexingPipeline(projectRoot);
          await pipeline.run({
            force: true,
            onProgress: (stage, detail) => {
              indexSpinner.text = chalk.hex("#EEFFFF")(`${stage}${detail ? ` (${detail})` : ""}`);
            }
          });
          const freshStats = repoManager.getProjectStats(repo.id);
          indexSpinner.succeed(
            chalk.hex("#C3E88D")(
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

      // Process Question with Animated Pixel Spinner
      const startTime = Date.now();
      console.log();

      const spinner = ora({
        spinner: PIXEL_SPINNER,
        text: chalk.hex("#EEFFFF")("Thinking & searching codebase..."),
        discardStdin: false
      }).start();

      try {
        const context = await retrievalEngine.retrieveContext(query);
        const durationSec = (Date.now() - startTime) / 1000;

        spinner.stop();

        // 1. Render Antigravity Tool Action Lines
        const uniquePaths = Array.from(new Set(context.chunks.map(c => c.filePath)));
        for (const p of uniquePaths.slice(0, 5)) {
          TerminalUI.renderToolAction("Read", `${projectRoot}/${p}`);
        }

        // 2. Render Thought Line
        TerminalUI.renderThoughtHeader(durationSec, context.tokenEstimate);

        if (context.totalChunksCount === 0) {
          console.log(chalk.yellow("  No relevant code context found for this query in the index.\n"));
          continue;
        }

        // 3. Synthesize Grounded Answer with Pixel Spinner
        const genSpinner = ora({
          spinner: PIXEL_SPINNER,
          text: chalk.hex("#EEFFFF")("Synthesizing grounded answer..."),
          discardStdin: false
        }).start();

        const result = await aiProvider.generateAnswer(
          query,
          context.assembledContextText,
          { systemInstruction: undefined }
        );

        genSpinner.stop();

        // 4. Render Clean Markdown (NO raw asterisks or markdown syntax!)
        const formatted = TerminalUI.formatMarkdown(result.answer);
        console.log(formatted);
        console.log();

        // 5. Resolve citations
        const resolvedSources =
          result.sources && result.sources.length > 0
            ? result.sources
            : context.chunks.slice(0, 5).map(c => ({
                path: c.filePath,
                startLine: c.startLine,
                endLine: c.endLine
              }));

        // 6. Render Sources & Bottom Status Bar
        TerminalUI.renderSources(resolvedSources, projectRoot);
        TerminalUI.renderBottomBar(config.chatModel || "Gemini 3.1 Flash");
      } catch (err: any) {
        spinner.stop();
        console.log(chalk.red(`\n  ✖ Error: ${err.message}\n`));
      }
    }
  } finally {
    rl.close();
  }
}
