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
import { TerminalUI } from "../../utils/ui.js";
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

  const dim = chalk.hex("#475569");
  console.log(`\n  ${dim("╭─")} ${chalk.hex("#818CF8").bold("◈ Question:")} ${chalk.hex("#F8FAFC").bold(`"${question}"`)}`);

  const retrievalStart = Date.now();
  TerminalUI.renderPipelineStep(1, 3, "Resolving AST Symbols & Call Graphs", "Querying local SQLite schema...");

  try {
    const embeddingProvider = createEmbeddingProvider(projectRoot);
    const aiProvider = new GeminiProvider(apiKey, {
      chatModel: config.chatModel
    });

    const vectorStore = new LanceVectorStore(vectorsDir);
    await vectorStore.initialize();

    const retrievalEngine = new RetrievalEngine(db, repo.id, vectorStore, embeddingProvider);
    const context = await retrievalEngine.retrieveContext(question);
    const retrievalDurationMs = Date.now() - retrievalStart;

    TerminalUI.renderPipelineStep(2, 3, "LanceDB Semantic Vector Ranking", `${context.chunks.length} candidate code chunks`, true);
    TerminalUI.renderPipelineStep(3, 3, "Multi-Hop Relational Context Assembly", `${context.totalChunksCount} chunks (${context.tokenEstimate} estimated tokens)`, true);

    if (context.totalChunksCount === 0) {
      console.log(chalk.yellow("\n  ⚠ No relevant code matches found for your question.\n"));
      return;
    }

    console.log(`\n  ${chalk.hex("#818CF8").bold("◈ Answer:")}\n`);

    const streamStart = Date.now();
    let accumulatedText = "";

    const result = await aiProvider.generateAnswerStream(
      question,
      context.assembledContextText,
      (chunk: string) => {
        process.stdout.write(chunk);
        accumulatedText += chunk;
      }
    );

    const streamDurationMs = Date.now() - streamStart;
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
    TerminalUI.renderLatencyFooter(retrievalDurationMs, streamDurationMs, resolvedSources.length);
  } catch (error: any) {
    console.log(chalk.red(`\n  ✖ Error: ${error.message || error}\n`));
    process.exitCode = 1;
  }
}
