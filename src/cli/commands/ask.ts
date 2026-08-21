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
import { Logger } from "../../utils/logger.js";
import { NotInitializedError, NotIndexedError, MissingApiKeyError } from "../../utils/errors.js";

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
    Logger.error("This repository has not been indexed yet or previous indexing was incomplete.\nPlease run:\n  codebase-ai index --force");
    process.exitCode = 1;
    return;
  }

  Logger.heading("Codebase AI Query");
  console.log(`Question: ${chalk.bold.cyan(`"${question}"`)}\n`);

  const spinner = ora({
    text: "Searching codebase index (symbols, vectors, relationships)...",
    color: "cyan",
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

    if (context.totalChunksCount === 0) {
      spinner.warn(chalk.yellow("No relevant code context found for your question."));
      return;
    }

    if (options.verbose) {
      spinner.stop();
      console.log(chalk.dim(`\n[verbose] Retrieved ${context.totalChunksCount} chunks (${context.totalCharacters} characters):`));
      for (const chunk of context.chunks) {
        console.log(chalk.dim(`  • [${chunk.retrievalSource}] ${chunk.filePath}:${chunk.startLine}-${chunk.endLine} (${chunk.symbolName})`));
      }
      console.log();
      spinner.start("Synthesizing grounded answer with Gemini...");
    } else {
      spinner.text = `Synthesizing answer from ${context.totalChunksCount} codebase evidence sources...`;
    }

    const result = await aiProvider.generateAnswer(question, context.assembledContextText);
    spinner.stop();

    console.log(result.answer);
    console.log();

    // Render source citations
    if (result.sources && result.sources.length > 0) {
      console.log(chalk.bold.green("Sources:"));
      const uniqueSources = new Map<string, { startLine: number; endLine: number }>();
      for (const s of result.sources) {
        const key = `${s.path}:${s.startLine}-${s.endLine}`;
        if (!uniqueSources.has(key)) {
          uniqueSources.set(key, { startLine: s.startLine, endLine: s.endLine });
          console.log(`  ${chalk.cyan(s.path)}${chalk.dim(`:${s.startLine}-${s.endLine}`)}`);
        }
      }
      console.log();
    } else if (context.chunks.length > 0) {
      console.log(chalk.bold.green("Sources:"));
      for (const chunk of context.chunks.slice(0, 4)) {
        console.log(`  ${chalk.cyan(chunk.filePath)}${chalk.dim(`:${chunk.startLine}-${chunk.endLine}`)}`);
      }
      console.log();
    }
  } catch (error: any) {
    spinner.fail(chalk.red("Failed to generate answer"));
    Logger.error(error.message || "An error occurred while answering your question.");
    if (Logger.isVerbose() && error.stack) {
      console.error(error.stack);
    }
    process.exitCode = 1;
  }
}
