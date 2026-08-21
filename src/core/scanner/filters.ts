import fs from "node:fs";
import path from "node:path";
import ignore, { type Ignore } from "ignore";
import { DEFAULT_EXCLUDES, SUPPORTED_EXTENSIONS } from "../../config/constants.js";

const createIgnore: () => Ignore = typeof ignore === "function" ? (ignore as any) : (ignore as any).default;

export class FileFilter {
  private readonly ignoreInstance: Ignore;
  private readonly customExcludes: string[];

  constructor(projectRoot: string, customExcludes: string[] = []) {
    this.customExcludes = customExcludes;
    this.ignoreInstance = createIgnore();

    // 1. Add default system excludes
    this.ignoreInstance.add(DEFAULT_EXCLUDES);

    // 2. Add custom excludes from config
    if (customExcludes.length > 0) {
      this.ignoreInstance.add(customExcludes);
    }

    // 3. Load root .gitignore if present
    const gitignorePath = path.join(projectRoot, ".gitignore");
    if (fs.existsSync(gitignorePath)) {
      try {
        const content = fs.readFileSync(gitignorePath, "utf8");
        this.ignoreInstance.add(content);
      } catch {
        // Fallback silently if .gitignore cannot be read
      }
    }
  }

  /**
   * Checks if a relative file/directory path is ignored by default excludes, gitignore, or custom rules.
   */
  isIgnored(relativePath: string): boolean {
    const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
    if (!normalized) return false;

    // Direct check for secret/env files
    if (this.isSecretFile(normalized)) {
      return true;
    }

    return this.ignoreInstance.ignores(normalized);
  }

  /**
   * Strictly detects secret or sensitive configuration files.
   */
  isSecretFile(relativePath: string): boolean {
    const filename = path.basename(relativePath);
    const lower = filename.toLowerCase();

    if (
      lower === ".env" ||
      lower.startsWith(".env.") ||
      lower.endsWith(".pem") ||
      lower.endsWith(".key") ||
      lower.endsWith(".pfx") ||
      lower.includes("id_rsa") ||
      lower.includes("id_ed25519") ||
      lower === ".npmrc" ||
      lower === ".netrc"
    ) {
      return true;
    }

    return false;
  }

  /**
   * Validates whether a file has a supported JavaScript / TypeScript extension.
   */
  isSupportedFile(filePath: string): boolean {
    const lower = filePath.toLowerCase().replace(/\\/g, "/");

    // Exclude TypeScript declaration files and sourcemaps
    if (
      lower.endsWith(".d.ts") ||
      lower.endsWith(".d.tsx") ||
      lower.endsWith(".d.ts.map") ||
      lower.endsWith(".js.map")
    ) {
      return false;
    }

    // Skip minified or bundle files
    if (lower.endsWith(".min.js") || lower.endsWith(".bundle.js")) {
      return false;
    }

    // Skip mobile webview assets (e.g. android/app/src/main/assets/public/assets/...)
    if (
      lower.includes("/android/") ||
      lower.includes("/ios/") ||
      lower.includes("/platforms/") ||
      lower.includes("/www/assets/") ||
      lower.includes("/public/assets/")
    ) {
      return false;
    }

    // Skip Vite / Webpack chunk bundles (e.g. AccountDashboardLayout-Bgm1Z146.js)
    const filename = path.basename(filePath);
    if (/[-.][a-zA-Z0-9_]{6,}\.(js|jsx)$/.test(filename) && (lower.includes("asset") || lower.includes("public"))) {
      return false;
    }

    const ext = path.extname(filePath).toLowerCase();
    return (SUPPORTED_EXTENSIONS as readonly string[]).includes(ext);
  }

  /**
   * Fast check for directories that should never be traversed.
   */
  shouldPruneDirectory(dirName: string): boolean {
    const prunedDirs = new Set([
      "node_modules",
      ".git",
      "dist",
      "build",
      "coverage",
      ".next",
      "out",
      ".cache",
      ".codebase-ai",
      ".turbo",
      ".output",
      ".nuxt",
      ".svelte-kit",
      ".husky",
      ".idea",
      ".vscode",
      "android",
      "ios",
      "platforms",
      "www"
    ]);

    return prunedDirs.has(dirName);
  }
}
