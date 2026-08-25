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
      Logger.info(`Kodast is already initialized in: ${chalk.bold(projectRoot)}`);
      Logger.info(`Run ${chalk.cyan("kodast status")} to view status or ${chalk.cyan("kodast index")} to index.`);
      return;
    }

    const { codebaseDir } = ConfigManager.init(projectRoot, { force: options.force });

    Logger.heading("Kodast Initialized");
    Logger.success(`Project root: ${chalk.bold(projectRoot)}`);
    Logger.success(`Storage directory created: ${chalk.dim(codebaseDir)}`);
    console.log();
    Logger.info("Next steps:");
    console.log(`  1. Set your Gemini API key (if not in GEMINI_API_KEY env):`);
    console.log(`     ${chalk.cyan("kodast config set api-key <YOUR_KEY>")}`);
    console.log(`  2. Index your repository:`);
    console.log(`     ${chalk.cyan("kodast index")}`);
    console.log(`  3. Ask questions or start the interactive REPL:`);
    console.log(`     ${chalk.cyan("kodast")} or ${chalk.cyan("kai")}`);
  } catch (error: any) {
    Logger.error(error.message || "Failed to initialize project");
    process.exitCode = 1;
  }
}
