import path from "node:path";
import chalk from "chalk";
import { ConfigManager } from "../../config/config-manager.js";
import { SqliteDatabase } from "../../storage/sqlite/db.js";
import { SqliteRepositoryManager } from "../../storage/sqlite/repositories.js";
import { DiagramGenerator } from "../../core/analysis/diagram-generator.js";
import { TerminalUI } from "../../utils/ui.js";
import { Logger } from "../../utils/logger.js";
import { NotInitializedError } from "../../utils/errors.js";

export async function diagramCommand(target?: string, options: { type?: string; ascii?: boolean } = {}): Promise<void> {
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
  const db = SqliteDatabase.get(dbPath);
  const repoManager = new SqliteRepositoryManager(db);
  const projectName = path.basename(projectRoot);
  const repo = repoManager.getOrCreateRepository(projectRoot, projectName);

  const generator = new DiagramGenerator(db, repo.id);

  console.log();
  console.log(`  ${chalk.hex("#82AAFF").bold("◈ Codebase Architecture & Flow Diagram")}`);
  console.log(`  ${chalk.hex("#676E95")(`Target: ${target || "Full System"}`)}\n`);

  if (options.ascii) {
    const ascii = generator.generateAsciiFlow(target);
    console.log(ascii);
    return;
  }

  if (options.type === "sequence" || options.type === "flow") {
    const mermaid = generator.generateCallFlowMermaid(target);
    const formatted = TerminalUI.formatMarkdown(mermaid);
    console.log(formatted);
  } else {
    const mermaid = generator.generateArchitectureMermaid(target);
    const formatted = TerminalUI.formatMarkdown(mermaid);
    console.log(formatted);
  }

  console.log();
}
