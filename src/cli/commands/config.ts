import chalk from "chalk";
import { ConfigManager } from "../../config/config-manager.js";
import { Logger } from "../../utils/logger.js";
import { NotInitializedError, NoProjectDetectedError } from "../../utils/errors.js";

export async function configCommand(
  action: "get" | "set" | "show" | "list",
  key?: string,
  value?: string
): Promise<void> {
  try {
    const cwd = process.cwd();
    const projectRoot = ConfigManager.findProjectRoot(cwd);

    if (!ConfigManager.isInitialized(projectRoot)) {
      ConfigManager.init(projectRoot);
    }

    const config = ConfigManager.loadConfig(projectRoot);

    if (action === "show" || action === "list" || !action) {
      Logger.heading("Current Configuration");
      const apiKey = ConfigManager.getApiKey(projectRoot);
      const maskedKey = apiKey
        ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`
        : chalk.yellow("(not set)");

      const voyageKey = ConfigManager.getVoyageApiKey(projectRoot);
      const maskedVoyageKey = voyageKey
        ? `${voyageKey.slice(0, 4)}...${voyageKey.slice(-4)}`
        : chalk.yellow("(not set)");

      console.log(`  ${chalk.bold("api-key (Gemini):")}    ${maskedKey}`);
      console.log(`  ${chalk.bold("voyage-key:")}          ${maskedVoyageKey}`);
      console.log(`  ${chalk.bold("embedding-provider:")} ${config.embeddingProvider || "voyage"}`);
      console.log(`  ${chalk.bold("embedding-model:")}    ${config.embeddingModel}`);
      console.log(`  ${chalk.bold("chat-model:")}         ${config.chatModel}`);
      if (config.exclude && config.exclude.length > 0) {
        console.log(`  ${chalk.bold("exclude:")}            ${config.exclude.join(", ")}`);
      }
      return;
    }

    if (action === "get") {
      if (!key) {
        Logger.error("Please specify a key to get. Example: codebase-ai config get voyage-key");
        process.exitCode = 1;
        return;
      }

      const normalizedKey = key.toLowerCase().replace(/-/g, "");
      if (normalizedKey === "apikey" || normalizedKey === "geminikey") {
        const apiKey = ConfigManager.getApiKey(projectRoot);
        console.log(apiKey ? chalk.green(apiKey) : chalk.yellow("Not set"));
      } else if (normalizedKey === "voyagekey" || normalizedKey === "voyageapikey") {
        const voyageKey = ConfigManager.getVoyageApiKey(projectRoot);
        console.log(voyageKey ? chalk.green(voyageKey) : chalk.yellow("Not set"));
      } else if (normalizedKey === "embeddingprovider" || normalizedKey === "provider") {
        console.log(config.embeddingProvider);
      } else if (normalizedKey === "chatmodel" || normalizedKey === "model") {
        console.log(config.chatModel);
      } else if (normalizedKey === "embeddingmodel") {
        console.log(config.embeddingModel);
      } else {
        Logger.error(`Unknown configuration key: ${key}`);
        process.exitCode = 1;
      }
      return;
    }

    if (action === "set") {
      if (!key || value === undefined) {
        Logger.error("Please specify key and value. Example: codebase-ai config set voyage-key <KEY>");
        process.exitCode = 1;
        return;
      }

      const normalizedKey = key.toLowerCase().replace(/-/g, "");

      if (normalizedKey === "apikey" || normalizedKey === "geminikey") {
        ConfigManager.saveConfig(projectRoot, { apiKey: value.trim() });
        ConfigManager.saveGlobalConfig({ apiKey: value.trim() });
        Logger.success(`Updated Gemini API key in configuration`);
      } else if (normalizedKey === "voyagekey" || normalizedKey === "voyageapikey") {
        ConfigManager.saveConfig(projectRoot, { voyageApiKey: value.trim(), embeddingProvider: "voyage" });
        ConfigManager.saveGlobalConfig({ voyageApiKey: value.trim(), embeddingProvider: "voyage" });
        Logger.success(`Updated Voyage AI API key in configuration (Provider set to Voyage)`);
      } else if (normalizedKey === "embeddingprovider" || normalizedKey === "provider") {
        const provider = value.trim().toLowerCase() === "gemini" ? "gemini" : "voyage";
        ConfigManager.saveConfig(projectRoot, { embeddingProvider: provider });
        ConfigManager.saveGlobalConfig({ embeddingProvider: provider });
        Logger.success(`Updated embedding provider to: ${chalk.bold(provider)}`);
      } else if (normalizedKey === "chatmodel" || normalizedKey === "model") {
        ConfigManager.saveConfig(projectRoot, { chatModel: value.trim() });
        ConfigManager.saveGlobalConfig({ chatModel: value.trim() });
        Logger.success(`Updated chat model to: ${chalk.bold(value.trim())}`);
      } else if (normalizedKey === "embeddingmodel") {
        ConfigManager.saveConfig(projectRoot, { embeddingModel: value.trim() });
        ConfigManager.saveGlobalConfig({ embeddingModel: value.trim() });
        Logger.success(`Updated embedding model to: ${chalk.bold(value.trim())}`);
      } else {
        Logger.error(`Unknown configuration key: ${key}. Valid keys: voyage-key, api-key, provider, chat-model, embedding-model`);
        process.exitCode = 1;
      }
      return;
    }

    Logger.error(`Unknown action: ${action}. Use get, set, or show.`);
    process.exitCode = 1;
  } catch (error: any) {
    if (error instanceof NoProjectDetectedError || error instanceof NotInitializedError) {
      Logger.error(error.message);
    } else {
      Logger.error(error.message || "Failed to process config command");
    }
    process.exitCode = 1;
  }
}
