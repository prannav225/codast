import path from "node:path";
import chalk from "chalk";
import ora from "ora";
import { ConfigManager } from "../../config/config-manager.js";
import { IndexingPipeline } from "../../core/indexing/pipeline.js";
import { Logger } from "../../utils/logger.js";
import { CodebaseAIError, NotInitializedError, MissingApiKeyError } from "../../utils/errors.js";

export async function indexCommand(options: { force?: boolean; verbose?: boolean } = {}): Promise<void> {
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

  const projectName = path.basename(projectRoot);
  Logger.heading("Codebase AI Indexer");
  console.log(`Repository: ${chalk.bold.cyan(projectName)} (${chalk.dim(projectRoot)})\n`);

  const spinner = ora({
    text: "Starting repository analysis...",
    color: "cyan"
  }).start();

  try {
    const pipeline = new IndexingPipeline(projectRoot);
    const result = await pipeline.run({
      force: options.force,
      verbose: options.verbose,
      onProgress: (stage, detail) => {
        spinner.text = `${stage}${detail ? ` - ${chalk.dim(detail)}` : ""}`;
      }
    });

    spinner.succeed(chalk.green("Repository indexing completed!"));
    console.log();
    console.log(`  ${chalk.green("✔")} Source files discovered:     ${chalk.bold(result.totalFiles)} (${result.parsedFiles} parsed, ${result.skippedFiles} cached)`);
    console.log(`  ${chalk.green("✔")} Symbols extracted:           ${chalk.bold(result.totalSymbols)}`);
    console.log(`  ${chalk.green("✔")} Code relationships traced:   ${chalk.bold(result.totalRelationships)}`);
    console.log(`  ${chalk.green("✔")} Logical chunks generated:    ${chalk.bold(result.totalChunks)}`);
    console.log(`  ${chalk.green("✔")} Embeddings generated:        ${chalk.bold(result.embeddedChunks)}`);
    console.log(`  ${chalk.green("✔")} Duration:                    ${chalk.bold((result.durationMs / 1000).toFixed(2))}s`);
    console.log();
    Logger.success("Codebase index is ready for questions!");
    console.log(`\nTry asking: ${chalk.cyan("kodast ask \"Explain the project structure\"")}\n`);
  } catch (error: any) {
    spinner.fail(chalk.red("Indexing failed"));
    if (error instanceof MissingApiKeyError) {
      Logger.error(error.message);
    } else {
      Logger.error(error.message || "An error occurred during indexing");
      if (Logger.isVerbose() && error.stack) {
        console.error(error.stack);
      }
    }
    process.exitCode = 1;
  }
}
