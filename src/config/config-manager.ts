import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  CODEBASE_DIR_NAME,
  CONFIG_FILE_NAME,
  METADATA_DB_NAME,
  VECTORS_DIR_NAME
} from "./constants.js";
import { ConfigSchema, type Config } from "./schema.js";
import { NotInitializedError, NoProjectDetectedError } from "../utils/errors.js";

export class ConfigManager {
  static getGlobalConfigDir(): string {
    return path.join(os.homedir(), CODEBASE_DIR_NAME);
  }

  static getGlobalConfigPath(): string {
    return path.join(this.getGlobalConfigDir(), CONFIG_FILE_NAME);
  }

  static loadGlobalConfig(): Config {
    const globalPath = this.getGlobalConfigPath();
    if (fs.existsSync(globalPath)) {
      try {
        const raw = fs.readFileSync(globalPath, "utf8");
        return ConfigSchema.parse(JSON.parse(raw));
      } catch {
        return ConfigSchema.parse({});
      }
    }
    return ConfigSchema.parse({});
  }

  static saveGlobalConfig(updates: Partial<Config>): Config {
    const globalDir = this.getGlobalConfigDir();
    if (!fs.existsSync(globalDir)) {
      fs.mkdirSync(globalDir, { recursive: true });
    }

    const current = this.loadGlobalConfig();
    const updated = ConfigSchema.parse({ ...current, ...updates });
    fs.writeFileSync(this.getGlobalConfigPath(), JSON.stringify(updated, null, 2), "utf8");
    return updated;
  }

  static findProjectRoot(startDir: string = process.cwd()): string {
    let currentDir = path.resolve(startDir);
    const { root } = path.parse(currentDir);

    while (currentDir !== root) {
      if (
        fs.existsSync(path.join(currentDir, CODEBASE_DIR_NAME)) ||
        fs.existsSync(path.join(currentDir, "package.json")) ||
        fs.existsSync(path.join(currentDir, "tsconfig.json")) ||
        fs.existsSync(path.join(currentDir, "jsconfig.json"))
      ) {
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }

    return path.resolve(startDir);
  }

  static getCodebaseDir(projectRoot: string): string {
    return path.join(projectRoot, CODEBASE_DIR_NAME);
  }

  static getMetadataDbPath(projectRoot: string): string {
    return path.join(this.getCodebaseDir(projectRoot), METADATA_DB_NAME);
  }

  static getVectorsDirPath(projectRoot: string): string {
    return path.join(this.getCodebaseDir(projectRoot), VECTORS_DIR_NAME);
  }

  static getConfigPath(projectRoot: string): string {
    return path.join(this.getCodebaseDir(projectRoot), CONFIG_FILE_NAME);
  }

  static isInitialized(projectRoot: string): boolean {
    return fs.existsSync(this.getConfigPath(projectRoot));
  }

  static init(projectRoot: string, options: { force?: boolean } = {}): { codebaseDir: string; configPath: string } {
    const codebaseDir = this.getCodebaseDir(projectRoot);
    const vectorsDir = this.getVectorsDirPath(projectRoot);
    const configPath = this.getConfigPath(projectRoot);

    if (this.isInitialized(projectRoot) && !options.force) {
      return { codebaseDir, configPath };
    }

    // Create directories
    fs.mkdirSync(codebaseDir, { recursive: true });
    fs.mkdirSync(vectorsDir, { recursive: true });

    // Initialize default config, inheriting global API keys
    if (!fs.existsSync(configPath) || options.force) {
      const globalConfig = this.loadGlobalConfig();
      const defaultConfig = ConfigSchema.parse({
        apiKey: globalConfig.apiKey || "",
        voyageApiKey: globalConfig.voyageApiKey || "",
        embeddingProvider: globalConfig.embeddingProvider || "voyage",
        embeddingModel: globalConfig.embeddingModel || "voyage-code-2",
        chatModel: globalConfig.chatModel
      });
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), "utf8");
    }

    // Write .gitignore inside .codebase-ai
    const gitignorePath = path.join(codebaseDir, ".gitignore");
    if (!fs.existsSync(gitignorePath)) {
      fs.writeFileSync(gitignorePath, "*\n!.gitignore\n", "utf8");
    }

    return { codebaseDir, configPath };
  }

  static loadConfig(projectRoot: string): Config {
    if (!this.isInitialized(projectRoot)) {
      this.init(projectRoot);
    }

    const configPath = this.getConfigPath(projectRoot);
    try {
      const raw = fs.readFileSync(configPath, "utf8");
      const localConfig = ConfigSchema.parse(JSON.parse(raw));
      const globalConfig = this.loadGlobalConfig();

      if (!localConfig.apiKey && globalConfig.apiKey) {
        localConfig.apiKey = globalConfig.apiKey;
      }
      if (!localConfig.voyageApiKey && globalConfig.voyageApiKey) {
        localConfig.voyageApiKey = globalConfig.voyageApiKey;
      }

      return localConfig;
    } catch {
      return ConfigSchema.parse({});
    }
  }

  static saveConfig(projectRoot: string, updates: Partial<Config>): Config {
    const current = this.loadConfig(projectRoot);
    const updated = ConfigSchema.parse({ ...current, ...updates });
    const configPath = this.getConfigPath(projectRoot);

    fs.writeFileSync(configPath, JSON.stringify(updated, null, 2), "utf8");
    return updated;
  }

  static getApiKey(projectRoot?: string): string | undefined {
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) {
      return process.env.GEMINI_API_KEY.trim();
    }

    if (projectRoot && this.isInitialized(projectRoot)) {
      const config = this.loadConfig(projectRoot);
      if (config.apiKey && config.apiKey.trim().length > 0) {
        return config.apiKey.trim();
      }
    }

    const globalConfig = this.loadGlobalConfig();
    if (globalConfig.apiKey && globalConfig.apiKey.trim().length > 0) {
      return globalConfig.apiKey.trim();
    }

    return undefined;
  }

  static getVoyageApiKey(projectRoot?: string): string | undefined {
    if (process.env.VOYAGE_API_KEY && process.env.VOYAGE_API_KEY.trim().length > 0) {
      return process.env.VOYAGE_API_KEY.trim();
    }

    if (projectRoot && this.isInitialized(projectRoot)) {
      const config = this.loadConfig(projectRoot);
      if (config.voyageApiKey && config.voyageApiKey.trim().length > 0) {
        return config.voyageApiKey.trim();
      }
    }

    const globalConfig = this.loadGlobalConfig();
    if (globalConfig.voyageApiKey && globalConfig.voyageApiKey.trim().length > 0) {
      return globalConfig.voyageApiKey.trim();
    }

    return undefined;
  }
}
