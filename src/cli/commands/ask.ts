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
import { TerminalUI, PIXEL_SPINNER } from "../../utils/ui.js";
import { Logger } from "../../utils/logger.js";
import { NotInitializedError, MissingApiKeyError } from "../../utils/errors.js";

export async function askCommand(question: string, options: { verbose?: boolean } = {}): Promise<void> {
  const cwd = process.cwd();
  let projectRoot: string;

  try {
    projectRoot = ConfigManager.findProjectRoot(cwd);
  } catch (error: any) {
    Logger.error(error.message);
    process.exitCode = 1;
    return;
  }

  if (!ConfigManager.isInitialized(projectRoot)) {
    Logger.error(new NotInitializedError().message);
    process.exitCode = 1;
    return;
  }

  const dbPath = ConfigManager.getMetadataDbPath(projectRoot);
  const vectorsDir = ConfigManager.getVectorsDirPath(projectRoot);
  const config = ConfigManager.loadConfig(projectRoot);
  const apiKey = ConfigManager.getApiKey(projectRoot);

  if (!apiKey) {
    Logger.error(new MissingApiKeyError().message);
    process.exitCode = 1;
    return;
  }

  const db = SqliteDatabase.get(dbPath);
  const repoManager = new SqliteRepositoryManager(db);
  const projectName = path.basename(projectRoot);
  const repo = repoManager.getOrCreateRepository(projectRoot, projectName);
  const stats = repoManager.getProjectStats(repo.id);

  if (repo.status !== "INDEXED" || stats.chunkCount === 0) {
    Logger.error("This repository has not been indexed yet.\nPlease run:\n  codast index --force");
    process.exitCode = 1;
    return;
  }

  console.log(`\n  ${chalk.hex("#89DDFF").bold(">")} ${chalk.hex("#EEFFFF").bold(question)}\n`);

  const startTime = Date.now();
  const spinner = ora({
    spinner: PIXEL_SPINNER,
    text: chalk.hex("#EEFFFF")("Searching codebase & reasoning..."),
    discardStdin: false
  }).start();

  try {
    const embeddingProvider = createEmbeddingProvider(projectRoot);
    const aiProvider = new GeminiProvider(apiKey, {
      chatModel: config.chatModel
    });

    const vectorStore = new LanceVectorStore(vectorsDir);
    await vectorStore.initialize();

    const retrievalEngine = new RetrievalEngine(db, repo.id, vectorStore, embeddingProvider);
    const context = await retrievalEngine.retrieveContext(question);
    const durationSec = (Date.now() - startTime) / 1000;

    spinner.stop();

    const uniquePaths = Array.from(new Set(context.chunks.map(c => c.filePath)));
    for (const p of uniquePaths.slice(0, 5)) {
      TerminalUI.renderToolAction("Read", `${projectRoot}/${p}`);
    }

    TerminalUI.renderThoughtHeader(durationSec, context.tokenEstimate);

    if (context.totalChunksCount === 0) {
      console.log(chalk.yellow("  No relevant code context found for your question.\n"));
      return;
    }

    const genSpinner = ora({
      spinner: PIXEL_SPINNER,
      text: chalk.hex("#EEFFFF")("Synthesizing grounded answer..."),
      discardStdin: false
    }).start();

    const result = await aiProvider.generateAnswer(question, context.assembledContextText);
    genSpinner.stop();

    // Render Clean Markdown (zero raw markdown tokens)
    const formatted = TerminalUI.formatMarkdown(result.answer);
    console.log(formatted);
    console.log();

    const resolvedSources =
      result.sources && result.sources.length > 0
        ? result.sources
        : context.chunks.slice(0, 5).map(c => ({
            path: c.filePath,
            startLine: c.startLine,
            endLine: c.endLine
          }));

    TerminalUI.renderSources(resolvedSources, projectRoot);
    TerminalUI.renderBottomBar(config.chatModel || "Gemini 3.1 Flash");
  } catch (error: any) {
    spinner.stop();
    console.log(chalk.red(`\n  ✖ Error: ${error.message || error}\n`));
    process.exitCode = 1;
  }
}
