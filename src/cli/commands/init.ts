import path from "node:path";
import chalk from "chalk";
import { ConfigManager } from "../../config/config-manager.js";
import { Logger } from "../../utils/logger.js";
import { NoProjectDetectedError } from "../../utils/errors.js";

export interface InitOptions {
  force?: boolean;
}

export async function initCommand(options: InitOptions = {}): Promise<void> {
  try {
    const cwd = process.cwd();
    let projectRoot: string;

    try {
      projectRoot = ConfigManager.findProjectRoot(cwd);
    } catch {
      // If not detected by files, initialize in current working directory
      projectRoot = path.resolve(cwd);
    }

    const wasInitialized = ConfigManager.isInitialized(projectRoot);

    if (wasInitialized && !options.force) {
      Logger.info(`Codebase AI is already initialized in: ${chalk.bold(projectRoot)}`);
      Logger.info(`Run ${chalk.cyan("codebase-ai status")} to view status or ${chalk.cyan("codebase-ai index")} to index.`);
      return;
    }

    const { codebaseDir } = ConfigManager.init(projectRoot, { force: options.force });

    Logger.heading("Codebase AI Initialized");
    Logger.success(`Project root: ${chalk.bold(projectRoot)}`);
    Logger.success(`Storage directory created: ${chalk.dim(codebaseDir)}`);
    console.log();
    Logger.info("Next steps:");
    console.log(`  1. Set your Gemini API key (if not in GEMINI_API_KEY env):`);
    console.log(`     ${chalk.cyan("codebase-ai config set api-key <YOUR_KEY>")}`);
    console.log(`  2. Index your repository:`);
    console.log(`     ${chalk.cyan("codebase-ai index")}`);
    console.log(`  3. Ask questions about your code:`);
    console.log(`     ${chalk.cyan("codebase-ai ask \"Where is authentication handled?\"")}`);
  } catch (error: any) {
    Logger.error(error.message || "Failed to initialize project");
    process.exitCode = 1;
  }
}
