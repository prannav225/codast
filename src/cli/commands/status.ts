import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import Database from "better-sqlite3";
import { ConfigManager } from "../../config/config-manager.js";
import { Logger } from "../../utils/logger.js";
import { NotInitializedError, NoProjectDetectedError } from "../../utils/errors.js";

export async function statusCommand(): Promise<void> {
  try {
    const cwd = process.cwd();
    const projectRoot = ConfigManager.findProjectRoot(cwd);
    const projectName = path.basename(projectRoot);

    if (!ConfigManager.isInitialized(projectRoot)) {
      Logger.heading("Codebase AI Status");
      Logger.warn(`Project: ${chalk.bold(projectName)} (${projectRoot})`);
      Logger.warn("Status: Not initialized");
      console.log(`\nRun ${chalk.cyan("codebase-ai init")} to initialize.`);
      return;
    }

    const config = ConfigManager.loadConfig(projectRoot);
    const dbPath = ConfigManager.getMetadataDbPath(projectRoot);
    const hasDb = fs.existsSync(dbPath);

    let isIndexed = false;
    let fileCount = 0;
    let symbolCount = 0;
    let relationshipCount = 0;
    let chunkCount = 0;
    let lastIndexedAt: string | null = null;

    if (hasDb) {
      try {
        const db = new Database(dbPath, { readonly: true, fileMustExist: true });
        
        // Check if tables exist
        const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='repositories'").get();
        if (tableCheck) {
          const repoRow: any = db.prepare("SELECT * FROM repositories ORDER BY id DESC LIMIT 1").get();
          if (repoRow) {
            isIndexed = repoRow.status === "INDEXED";
            lastIndexedAt = repoRow.last_indexed_at;
          }

          const fileRow: any = db.prepare("SELECT COUNT(*) as count FROM files").get();
          fileCount = fileRow?.count ?? 0;

          const symRow: any = db.prepare("SELECT COUNT(*) as count FROM symbols").get();
          symbolCount = symRow?.count ?? 0;

          const relRow: any = db.prepare("SELECT COUNT(*) as count FROM relationships").get();
          relationshipCount = relRow?.count ?? 0;

          const chunkRow: any = db.prepare("SELECT COUNT(*) as count FROM chunks").get();
          chunkCount = chunkRow?.count ?? 0;
        }
        db.close();
      } catch {
        isIndexed = false;
      }
    }

    const apiKey = ConfigManager.getApiKey(projectRoot);
    const apiKeyStatus = apiKey
      ? chalk.green(`Configured (${apiKey.slice(0, 4)}...${apiKey.slice(-4)})`)
      : chalk.yellow("Not configured");

    const voyageKey = ConfigManager.getVoyageApiKey(projectRoot);
    const voyageStatus = voyageKey
      ? chalk.green(`Configured (${voyageKey.slice(0, 4)}...${voyageKey.slice(-4)})`)
      : chalk.yellow("Not configured");

    Logger.heading("Codebase AI Status");
    console.log(`  ${chalk.bold("Repository:")}        ${chalk.cyan(projectName)}`);
    console.log(`  ${chalk.bold("Root Path:")}         ${chalk.dim(projectRoot)}`);
    console.log(`  ${chalk.bold("Initialized:")}       ${chalk.green("Yes")}`);
    console.log(`  ${chalk.bold("Indexed:")}           ${isIndexed ? chalk.green("Yes") : chalk.yellow("No (run 'codebase-ai index')")}`);
    if (lastIndexedAt) {
      console.log(`  ${chalk.bold("Last Indexed:")}      ${chalk.dim(new Date(lastIndexedAt).toLocaleString())}`);
    }
    console.log(`  ${chalk.bold("Indexed Files:")}     ${chalk.cyan(fileCount)}`);
    console.log(`  ${chalk.bold("Symbols Extracted:")} ${chalk.cyan(symbolCount)}`);
    console.log(`  ${chalk.bold("Relationships:")}     ${chalk.cyan(relationshipCount)}`);
    console.log(`  ${chalk.bold("Logical Chunks:")}    ${chalk.cyan(chunkCount)}`);
    console.log(`  ${chalk.bold("Gemini API Key:")}    ${apiKeyStatus}`);
    console.log(`  ${chalk.bold("Voyage API Key:")}    ${voyageStatus}`);
    console.log(`  ${chalk.bold("Embedding Provider:")}${chalk.bold(config.embeddingProvider || "voyage")}`);
    console.log(`  ${chalk.bold("Embedding Model:")}   ${chalk.dim(config.embeddingModel)}`);
    console.log(`  ${chalk.bold("Chat Model:")}        ${chalk.dim(config.chatModel)}`);
    console.log();
  } catch (error: any) {
    if (error instanceof NoProjectDetectedError) {
      Logger.error(error.message);
    } else {
      Logger.error(error.message || "Failed to retrieve status");
    }
    process.exitCode = 1;
  }
}
