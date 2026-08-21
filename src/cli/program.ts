import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { statusCommand } from "./commands/status.js";
import { configCommand } from "./commands/config.js";
import { indexCommand } from "./commands/index.js";
import { askCommand } from "./commands/ask.js";
import { chatCommand } from "./commands/chat.js";
import { Logger } from "../utils/logger.js";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("codast")
    .description("⚡ AI-Powered Local Codebase Intelligence & Interactive Assistant")
    .version("0.1.0")
    .option("-v, --verbose", "enable verbose logging", () => {
      Logger.setVerbose(true);
    })
    .action(async () => {
      // Default action when running `cai` with no subcommand: Start Interactive Chat REPL!
      await chatCommand();
    });

  program
    .command("chat")
    .description("Start an interactive chat session with your codebase")
    .action(async () => {
      await chatCommand();
    });

  program
    .command("init")
    .description("Initialize Codebase AI in the current project")
    .option("-f, --force", "overwrite existing configuration")
    .action(async (options) => {
      await initCommand(options);
    });

  program
    .command("status")
    .description("Display index status, file counts, and configuration")
    .action(async () => {
      await statusCommand();
    });

  program
    .command("config")
    .description("Manage configuration settings (voyage-key, api-key, chat-model, embedding-model)")
    .argument("[action]", "action to perform (get, set, show, list)", "show")
    .argument("[key]", "configuration key")
    .argument("[value]", "configuration value to set")
    .action(async (action, key, value) => {
      await configCommand(action as any, key, value);
    });

  program
    .command("index")
    .description("Scan, parse, chunk, and embed the repository")
    .option("-f, --force", "force full re-index of unchanged files")
    .option("--verbose", "display detailed parsing and chunking progress")
    .action(async (options) => {
      if (options.verbose) Logger.setVerbose(true);
      await indexCommand(options);
    });

  program
    .command("ask")
    .description("Ask a one-off question about your indexed codebase")
    .argument("<question>", "natural-language question")
    .option("--verbose", "display retrieved context and citations metrics")
    .action(async (question, options) => {
      if (options.verbose) Logger.setVerbose(true);
      await askCommand(question, options);
    });

  return program;
}
