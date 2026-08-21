import fs from "node:fs";
import path from "node:path";
import { FileFilter } from "./filters.js";
import { computeHash } from "../../utils/hash.js";
import { Logger } from "../../utils/logger.js";

export interface ScannedFile {
  relativePath: string;
  absolutePath: string;
  extension: string;
  sizeBytes: number;
  lineCount: number;
  contentHash: string;
}

export interface ScanResult {
  files: ScannedFile[];
  totalFiles: number;
  totalLines: number;
  totalBytes: number;
  skippedFilesCount: number;
}

export class RepositoryScanner {
  private readonly filter: FileFilter;
  private readonly projectRoot: string;

  constructor(projectRoot: string, customExcludes: string[] = []) {
    this.projectRoot = path.resolve(projectRoot);
    this.filter = new FileFilter(this.projectRoot, customExcludes);
  }

  /**
   * Recursively scans the repository for supported JavaScript/TypeScript source files.
   */
  async scan(): Promise<ScanResult> {
    const files: ScannedFile[] = [];
    let skippedFilesCount = 0;
    let totalLines = 0;
    let totalBytes = 0;

    const traverse = (currentDir: string) => {
      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(currentDir, { withFileTypes: true });
      } catch (err: any) {
        Logger.debug("scanner", `Unable to read directory: ${currentDir} (${err.message})`);
        return;
      }

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relativePath = path.relative(this.projectRoot, fullPath).replace(/\\/g, "/");

        if (entry.isDirectory()) {
          // Fast directory pruning
          if (this.filter.shouldPruneDirectory(entry.name) || this.filter.isIgnored(relativePath + "/")) {
            Logger.debug("scanner", `Pruned directory: ${relativePath}`);
            continue;
          }
          traverse(fullPath);
        } else if (entry.isFile()) {
          if (this.filter.isIgnored(relativePath)) {
            skippedFilesCount++;
            Logger.debug("scanner", `Ignored file: ${relativePath}`);
            continue;
          }

          if (!this.filter.isSupportedFile(relativePath)) {
            skippedFilesCount++;
            continue;
          }

          try {
            const content = fs.readFileSync(fullPath, "utf8");
            const stat = fs.statSync(fullPath);
            const lineCount = content.length === 0 ? 0 : content.split(/\r\n|\r|\n/).length;
            const contentHash = computeHash(content);
            const extension = path.extname(entry.name).toLowerCase();

            files.push({
              relativePath,
              absolutePath: fullPath,
              extension,
              sizeBytes: stat.size,
              lineCount,
              contentHash
            });

            totalLines += lineCount;
            totalBytes += stat.size;
          } catch (err: any) {
            Logger.debug("scanner", `Error reading file ${relativePath}: ${err.message}`);
            skippedFilesCount++;
          }
        }
      }
    };

    traverse(this.projectRoot);

    // Sort files deterministically by relative path
    files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

    return {
      files,
      totalFiles: files.length,
      totalLines,
      totalBytes,
      skippedFilesCount
    };
  }

  getFileFilter(): FileFilter {
    return this.filter;
  }
}
