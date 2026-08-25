import path from "node:path";
import chalk from "chalk";
import { ConfigManager } from "../../config/config-manager.js";
import { FileWatcher } from "../../core/watcher/file-watcher.js";
import { TerminalUI } from "../../utils/ui.js";
import { Logger } from "../../utils/logger.js";
import { NotInitializedError } from "../../utils/errors.js";

export async function watchCommand(): Promise<void> {
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
  console.clear();
  console.log();
  console.log(`  ${chalk.hex("#82AAFF").bold("◈ Kodast Live File Watcher")}`);
  console.log(`  ${chalk.hex("#676E95")(`Watching ${projectName} (${projectRoot}) for live changes...`)}`);
  console.log(`  ${chalk.hex("#676E95")("Press Ctrl+C to exit.")}\n`);

  const watcher = new FileWatcher(projectRoot);

  watcher.start({
    onIndexed: (relPath, symbols, chunks, durationMs) => {
      const bullet = chalk.hex("#C3E88D")("●");
      const action = chalk.hex("#EEFFFF").bold("Re-indexed");
      const filePath = chalk.hex("#89DDFF")(relPath);
      const metrics = chalk.hex("#676E95")(`(${symbols} symbols, ${chunks} chunks in ${durationMs}ms)`);
      console.log(`  ${bullet} ${action} ${filePath} ${metrics}`);
    },
    onRemoved: relPath => {
      const bullet = chalk.hex("#FF5370")("●");
      const action = chalk.hex("#EEFFFF").bold("Removed");
      const filePath = chalk.hex("#89DDFF")(relPath);
      console.log(`  ${bullet} ${action} ${filePath}`);
    },
    onError: (relPath, err) => {
      const bullet = chalk.hex("#FF5370")("✖");
      console.log(`  ${bullet} ${chalk.red(`Error indexing ${relPath}: ${err.message}`)}`);
    }
  });

  // Keep process alive until interrupted
  process.on("SIGINT", () => {
    watcher.stop();
    console.log(chalk.hex("#89DDFF")("\n\nStopped file watcher. Have a great day, Sir!\n"));
    process.exit(0);
  });
}
