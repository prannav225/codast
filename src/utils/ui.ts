import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";

export class TerminalUI {
  /**
   * Detects the current active git branch if in a git repository.
   */
  static getGitBranch(projectRoot: string): string | null {
    try {
      const headPath = path.join(projectRoot, ".git", "HEAD");
      if (fs.existsSync(headPath)) {
        const head = fs.readFileSync(headPath, "utf8").trim();
        if (head.startsWith("ref: refs/heads/")) {
          return head.replace("ref: refs/heads/", "");
        }
        return head.slice(0, 7);
      }
    } catch {
      // Ignore if not a git repo
    }
    return null;
  }

  /**
   * Renders a modern titanium status card with rounded Unicode box framing.
   */
  static renderBanner(
    projectName: string,
    stats?: { files: number; symbols: number; chunks: number },
    config?: { chatModel?: string; embeddingModel?: string; embeddingProvider?: string },
    projectRoot: string = process.cwd()
  ): void {
    console.clear();

    const brand = chalk.hex("#818CF8").bold;     // Indigo
    const accent = chalk.hex("#34D399").bold;    // Emerald
    const textMain = chalk.hex("#F8FAFC");       // Crisp White
    const textMuted = chalk.hex("#94A3B8");      // Slate Gray
    const dim = chalk.hex("#475569");            // Border Slate
    const tag = chalk.hex("#38BDF8");            // Ice Blue

    const gitBranch = this.getGitBranch(projectRoot);
    const branchBadge = gitBranch ? ` ${chalk.hex("#FCD34D")(` ${gitBranch}`)}` : "";

    const chatModel = config?.chatModel || "gemini-3.1-flash-lite";
    const embedModel = config?.embeddingModel || "voyage-code-2";
    const provider = config?.embeddingProvider || "voyage";

    console.log();
    console.log(`  ${dim("╭─")} ${brand("◈ CODAST")} ${dim("•")} ${textMuted("Local Code Intelligence REPL")} ${dim("──────────────────────────")} ${tag("v0.1.1")} ${dim("─╮")}`);

    if (stats) {
      const line1 = `  ${dim("│")}  ${textMuted("repo:")} ${textMain.bold(projectName)}${branchBadge}  ${dim("│")}  ${textMuted("files:")} ${accent(stats.files)}  ${dim("│")}  ${textMuted("symbols:")} ${accent(stats.symbols)}  ${dim("│")}  ${textMuted("chunks:")} ${accent(stats.chunks)}`;
      console.log(line1);
    } else {
      const line1 = `  ${dim("│")}  ${textMuted("repo:")} ${textMain.bold(projectName)}${branchBadge}`;
      console.log(line1);
    }

    const line2 = `  ${dim("│")}  ${textMuted("model:")} ${chalk.hex("#E2E8F0")(chatModel)}  ${dim("│")}  ${textMuted("embed:")} ${chalk.hex("#E2E8F0")(`${provider}:${embedModel}`)}`;
    console.log(line2);

    console.log(`  ${dim("╰──────────────────────────────────────────────────────────────────────────────╯")}`);
    console.log(`  ${textMuted("Type questions naturally. Type")} ${brand("/help")} ${textMuted("for commands or")} ${brand("/exit")} ${textMuted("to quit.")}`);
    console.log();
  }

  /**
   * Renders the interactive command prompt with repository name and git branch.
   */
  static getPrompt(projectName: string, projectRoot: string = process.cwd()): string {
    const repoBadge = chalk.hex("#818CF8").bold(projectName);
    const gitBranch = this.getGitBranch(projectRoot);
    const branchBadge = gitBranch ? ` ${chalk.hex("#FCD34D")(` ${gitBranch}`)}` : "";
    const arrow = chalk.hex("#34D399")("❯");

    return `${repoBadge}${branchBadge} ${arrow} `;
  }

  /**
   * Renders a live multi-stage reasoning pipeline step.
   */
  static renderPipelineStep(step: number, total: number, title: string, detail?: string, isDone: boolean = false): void {
    const icon = isDone ? chalk.hex("#34D399")("✔") : chalk.hex("#818CF8")("✦");
    const stepLabel = chalk.hex("#64748B")(`[${step}/${total}]`);
    const titleText = chalk.hex("#F8FAFC").bold(title);
    const detailText = detail ? chalk.hex("#94A3B8")(` • ${detail}`) : "";

    console.log(`  ${icon} ${stepLabel} ${titleText}${detailText}`);
  }

  /**
   * Generates OSC-8 terminal hyperlinks so clicking the file path opens it in the user's editor.
   */
  static createHyperlink(displayPath: string, fullPath: string, startLine?: number): string {
    const lineSuffix = startLine ? `:${startLine}` : "";
    const targetUri = startLine ? `file://${fullPath}#${startLine}` : `file://${fullPath}`;
    // OSC 8 Hyperlink: \u001b]8;;URI\u0007TEXT\u001b]8;;\u0007
    return `\u001b]8;;${targetUri}\u0007${displayPath}${lineSuffix}\u001b]8;;\u0007`;
  }

  /**
   * Renders sources & citations with OSC-8 hyperlinks in a clean box.
   */
  static renderSources(
    sources: Array<{ path: string; startLine: number; endLine: number }>,
    projectRoot: string = process.cwd()
  ): void {
    if (sources.length === 0) return;

    const dim = chalk.hex("#475569");
    const header = chalk.hex("#818CF8").bold("Sources & Evidence");

    console.log(`\n  ${dim("╭─")} ${header} ${dim("───────────────────────────────────────────────────╮")}`);
    const seen = new Set<string>();

    for (const s of sources) {
      const key = `${s.path}:${s.startLine}-${s.endLine}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const fullPath = path.isAbsolute(s.path) ? s.path : path.join(projectRoot, s.path);
      const linkText = this.createHyperlink(s.path, fullPath, s.startLine);
      const lineRange = chalk.hex("#64748B")(`:${s.startLine}-${s.endLine}`);

      console.log(`  ${dim("│")}  ${chalk.hex("#34D399")("↳")} ${chalk.hex("#93C5FD")(linkText)}${lineRange}`);
    }
    console.log(`  ${dim("╰──────────────────────────────────────────────────────────────────────────╯")}`);
  }

  /**
   * Renders a high-tech execution latency and performance metric footer.
   */
  static renderLatencyFooter(retrievalMs: number, streamMs: number, sourceCount: number): void {
    const bolt = chalk.hex("#FCD34D")("⚡");
    const retLabel = chalk.hex("#94A3B8")(`Retrieved in ${chalk.hex("#F8FAFC").bold(`${retrievalMs}ms`)}`);
    const streamLabel = chalk.hex("#94A3B8")(`Streamed in ${chalk.hex("#F8FAFC").bold(`${(streamMs / 1000).toFixed(2)}s`)}`);
    const srcLabel = chalk.hex("#94A3B8")(`${chalk.hex("#34D399").bold(sourceCount)} citation${sourceCount === 1 ? "" : "s"}`);
    const dim = chalk.hex("#475569")("•");

    console.log(`\n  ${bolt} ${retLabel} ${dim} ${streamLabel} ${dim} ${srcLabel}\n`);
  }

  /**
   * Formats markdown with rich code blocks, line numbers, and language pills.
   */
  static formatMarkdown(markdown: string): string {
    let formatted = markdown;

    const h1 = chalk.hex("#F8FAFC").bold;
    const h2 = chalk.hex("#818CF8").bold;
    const h3 = chalk.hex("#A5B4FC").bold;
    const codeInline = chalk.hex("#FCD34D");
    const bullet = chalk.hex("#818CF8");
    const numberBullet = chalk.hex("#34D399");

    // Headers
    formatted = formatted.replace(/^### (.*$)/gim, (_, text) => `\n${h3(`  ▸ ${text}`)}`);
    formatted = formatted.replace(/^## (.*$)/gim, (_, text) => `\n${h2(`  ● ${text}`)}`);
    formatted = formatted.replace(/^# (.*$)/gim, (_, text) => `\n${h1(`  ■ ${text}`)}`);

    // Bold & Inline Code
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, chalk.hex("#FFFFFF").bold("$1"));
    formatted = formatted.replace(/`([^`]+)`/g, (_, code) => codeInline(code));

    // Bullet points & numbering
    formatted = formatted.replace(/^\s*[-*]\s+(.*$)/gim, `  ${bullet("•")} $1`);
    formatted = formatted.replace(/^\s*(\d+)\.\s+(.*$)/gim, (_, num, text) => `  ${numberBullet(`${num}.`)} ${text}`);

    // Clean code blocks with language pills
    formatted = formatted.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const langUpper = lang ? lang.toUpperCase() : "CODE";
      const langBadge = chalk.hex("#F8FAFC").bgHex("#334155").bold(` ${langUpper} `);
      const border = chalk.hex("#334155");

      const codeLines = code.trim().split("\n");
      const indented = codeLines
        .map((line: string, idx: number) => {
          const lineNum = chalk.hex("#475569")(`${String(idx + 1).padStart(3, " ")} │ `);
          return `  ${border("│")} ${lineNum}${chalk.hex("#E2E8F0")(line)}`;
        })
        .join("\n");

      return `\n  ${border("╭─")} ${langBadge} ${border("──────────────────────────────────────────")}\n${indented}\n  ${border("╰──────────────────────────────────────────────────")}\n`;
    });

    return formatted;
  }

  /**
   * Renders a visual directory file tree.
   */
  static renderFileTree(files: Array<{ path: string; lines?: number }>, maxFiles: number = 35): void {
    const dim = chalk.hex("#475569");
    const folderColor = chalk.hex("#818CF8").bold;
    const fileColor = chalk.hex("#E2E8F0");
    const countColor = chalk.hex("#64748B");

    console.log(`\n  ${chalk.hex("#818CF8").bold("◈ Codebase File Tree")} ${dim(`(${files.length} indexed files)`)}:`);
    console.log(`  ${dim("──────────────────────────────────────────────────")}`);

    const tree: { [key: string]: any } = {};
    for (const f of files.slice(0, maxFiles)) {
      const parts = f.path.split("/");
      let current = tree;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (i === parts.length - 1) {
          current[p] = f.lines || 0;
        } else {
          current[p] = current[p] || {};
          current = current[p];
        }
      }
    }

    const printBranch = (node: any, prefix: string = "  ") => {
      const entries = Object.entries(node);
      entries.forEach(([key, val], idx) => {
        const isLast = idx === entries.length - 1;
        const branch = isLast ? "└── " : "├── ";
        if (typeof val === "object") {
          console.log(`${prefix}${dim(branch)}${folderColor(key)}/`);
          printBranch(val, `${prefix}${isLast ? "    " : "│   "}`);
        } else {
          const lineInfo = val ? ` ${countColor(`(${val} lines)`)}` : "";
          console.log(`${prefix}${dim(branch)}${fileColor(key)}${lineInfo}`);
        }
      });
    };

    printBranch(tree);

    if (files.length > maxFiles) {
      console.log(`  ${dim("...")} ${chalk.hex("#94A3B8")(`and ${files.length - maxFiles} more files`)}`);
    }
    console.log(`  ${dim("──────────────────────────────────────────────────")}\n`);
  }

  /**
   * Renders the help menu inside REPL.
   */
  static renderHelp(): void {
    const cmd = chalk.hex("#818CF8").bold;
    const desc = chalk.hex("#94A3B8");
    const dim = chalk.hex("#475569");

    console.log(`
  ${chalk.hex("#F8FAFC").bold("◈ REPL Slash Commands:")}
  ${dim("──────────────────────────────────────────────────────────")}
    ${cmd("/index")}       ${desc("Re-scan and index codebase on the fly")}
    ${cmd("/tree")}        ${desc("View visual directory file tree")}
    ${cmd("/status")}      ${desc("View indexed files, symbols, chunks & models")}
    ${cmd("/files")}       ${desc("List indexed source files")}
    ${cmd("/config")}      ${desc("View active API keys and model configurations")}
    ${cmd("/clear")}       ${desc("Clear the terminal screen")}
    ${cmd("/help")}        ${desc("Show this command reference cheatsheet")}
    ${cmd("/exit")}        ${desc("Exit the chat session")}

  ${chalk.hex("#F8FAFC").bold("◈ Example Questions:")}
  ${dim("──────────────────────────────────────────────────────────")}
    • "How does authentication flow work in this codebase?"
    • "Where are the API routes configured?"
    • "Trace all callers of the payment processing service"
    • "Explain the state management and data store architecture"
`);
  }
}
