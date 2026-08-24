import fs from "node:fs";
import path from "node:path";
import { IndexingPipeline } from "../indexing/pipeline.js";
import { FileFilter } from "../scanner/filters.js";
import { ConfigManager } from "../../config/config-manager.js";
import { Logger } from "../../utils/logger.js";

export interface FileWatcherOptions {
  debounceMs?: number;
  onIndexed?: (relPath: string, symbols: number, chunks: number, durationMs: number) => void;
  onRemoved?: (relPath: string) => void;
  onError?: (relPath: string, err: Error) => void;
}

export class FileWatcher {
  private readonly projectRoot: string;
  private readonly pipeline: IndexingPipeline;
  private readonly filter: FileFilter;
  private readonly debounceMs: number;
  private isWatching: boolean = false;
  private watchers: fs.FSWatcher[] = [];
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  constructor(projectRoot: string, options: FileWatcherOptions = {}) {
    this.projectRoot = path.resolve(projectRoot);
    this.pipeline = new IndexingPipeline(this.projectRoot);
    const config = ConfigManager.loadConfig(this.projectRoot);
    this.filter = new FileFilter(this.projectRoot, config.exclude);
    this.debounceMs = options.debounceMs || 300;
  }

  /**
   * Starts recursive file watching across the project tree.
   */
  start(callbacks: FileWatcherOptions = {}): void {
    if (this.isWatching) return;
    this.isWatching = true;

    try {
      const watcher = fs.watch(
        this.projectRoot,
        { recursive: true },
        (eventType, filename) => {
          if (!filename) return;

          const absPath = path.join(this.projectRoot, filename);
          const relPath = path.relative(this.projectRoot, absPath);

          // Check if file is ignored
          if (this.filter.isIgnored(relPath) || !this.filter.isSupportedExtension(relPath)) {
            return;
          }

          this.scheduleSync(relPath, absPath, callbacks);
        }
      );

      this.watchers.push(watcher);
      Logger.debug("file-watcher", `File watcher active on ${this.projectRoot}`);
    } catch (err: any) {
      Logger.error(`Failed to start file watcher: ${err.message}`);
    }
  }

  /**
   * Stops all active file watchers.
   */
  stop(): void {
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    for (const watcher of this.watchers) {
      watcher.close();
    }
    this.watchers = [];
    this.isWatching = false;
  }

  private scheduleSync(relPath: string, absPath: string, callbacks: FileWatcherOptions): void {
    if (this.debounceTimers.has(relPath)) {
      clearTimeout(this.debounceTimers.get(relPath)!);
    }

    const timer = setTimeout(async () => {
      this.debounceTimers.delete(relPath);
      const start = Date.now();

      try {
        if (fs.existsSync(absPath)) {
          const res = await this.pipeline.indexSingleFile(relPath);
          const duration = Date.now() - start;
          if (callbacks.onIndexed) {
            callbacks.onIndexed(relPath, res.symbolCount, res.chunkCount, duration);
          }
        } else {
          await this.pipeline.removeFile(relPath);
          if (callbacks.onRemoved) {
            callbacks.onRemoved(relPath);
          }
        }
      } catch (err: any) {
        if (callbacks.onError) {
          callbacks.onError(relPath, err);
        }
      }
    }, this.debounceMs);

    this.debounceTimers.set(relPath, timer);
  }
}
