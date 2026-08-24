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
   * Renders the iconic Antigravity-inspired geometric pixel banner with metadata.
   */
  static renderBanner(
    projectName: string,
    stats?: { files: number; symbols: number; chunks: number },
    config?: { chatModel?: string; embeddingModel?: string; embeddingProvider?: string },
    projectRoot: string = process.cwd()
  ): void {
    console.clear();

    const coral = chalk.hex("#FF5370");
    const amber = chalk.hex("#FFCB6B");
    const emerald = chalk.hex("#C3E88D");
    const cyan = chalk.hex("#89DDFF");
    const blue = chalk.hex("#82AAFF");
    const purple = chalk.hex("#C792EA");

    const title = chalk.hex("#82AAFF").bold;
    const textMain = chalk.hex("#EEFFFF");
    const textMuted = chalk.hex("#676E95");
    const rule = chalk.hex("#3B4261");

    const gitBranch = this.getGitBranch(projectRoot);
    const branchInfo = gitBranch ? ` (${gitBranch})` : "";
    const chatModel = config?.chatModel || "Gemini 3.1 Flash Lite";
    const provider = config?.embeddingProvider || "voyage";
    const embedModel = config?.embeddingModel || "voyage-code-2";

    console.log();
    // Multi-colored pixel icon + metadata block (Antigravity CLI style)
    console.log(`  ${coral("▄▄")}${amber("▄▄")}      ${title("Codast CLI 0.1.1")}`);
    console.log(`  ${amber("██")}${emerald("██")}      ${textMuted(`Local Code Intelligence & REPL`)}`);
    console.log(`  ${emerald("██")}${cyan("██")}      ${textMain(`${chatModel}`)} ${textMuted(`(${provider}: ${embedModel})`)}`);
    console.log(`  ${blue("██")}${purple("██")}      ${textMuted(`${projectRoot}${branchInfo}`)}`);
    console.log(`  ${purple("▀▀")}${blue("▀▀")}`);
    console.log(`  ${rule("─────────────────────────────────────────────────────────────────────────────")}`);
    console.log();
  }

  /**
   * Renders the clean minimal Antigravity prompt.
   */
  static getPrompt(projectName?: string, projectRoot: string = process.cwd()): string {
    const arrow = chalk.hex("#89DDFF").bold(">");
    return `${arrow} `;
  }

  /**
   * Renders Antigravity-style tool action log lines.
   */
  static renderToolAction(actionName: string, targetPath: string): void {
    const bullet = chalk.hex("#FFCB6B")("●");
    const action = chalk.hex("#EEFFFF").bold(actionName);
    const target = chalk.hex("#89DDFF")(`(${targetPath})`);

    console.log(`  ${bullet} ${action}${target}`);
  }

  /**
   * Renders the Antigravity thought summary line.
   */
  static renderThoughtHeader(durationSeconds: number, tokenCount: number): void {
    const arrow = chalk.hex("#676E95")("▸");
    const thoughtText = chalk.hex("#676E95").italic(`Thought for ${durationSeconds.toFixed(1)}s, ${tokenCount.toLocaleString()} tokens`);
    console.log(`\n  ${arrow} ${thoughtText}\n`);
  }

  /**
   * Generates OSC-8 terminal hyperlinks so clicking the file path opens it in the user's editor.
   */
  static createHyperlink(displayPath: string, fullPath: string, startLine?: number): string {
    const targetUri = startLine ? `file://${fullPath}#${startLine}` : `file://${fullPath}`;
    return `\u001b]8;;${targetUri}\u0007${displayPath}\u001b]8;;\u0007`;
  }

  /**
   * Renders sources & citations cleanly in Antigravity style.
   */
  static renderSources(
    sources: Array<{ path: string; startLine: number; endLine: number }>,
    projectRoot: string = process.cwd()
  ): void {
    if (sources.length === 0) return;

    const header = chalk.hex("#C792EA").bold("Sources & Citations:");
    console.log(`\n  ${header}`);
    const seen = new Set<string>();

    for (const s of sources) {
      const key = `${s.path}:${s.startLine}-${s.endLine}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const fullPath = path.isAbsolute(s.path) ? s.path : path.join(projectRoot, s.path);
      const linkText = this.createHyperlink(s.path, fullPath, s.startLine);
      const lineRange = chalk.hex("#676E95")(`:${s.startLine}-${s.endLine}`);

      console.log(`    ${chalk.hex("#89DDFF")("↳")} ${chalk.hex("#82AAFF")(linkText)}${lineRange}`);
    }
  }

  /**
   * Renders the bottom Antigravity status bar.
   */
  static renderBottomBar(modelName: string = "Gemini 3.1 Flash"): void {
    const rule = chalk.hex("#3B4261");
    const left = chalk.hex("#676E95")("? for shortcuts");
    const right = chalk.hex("#676E95")(`${modelName} • high`);
    const width = 77;
    const padding = " ".repeat(Math.max(1, width - left.length - right.length));

    console.log(`\n  ${rule("─────────────────────────────────────────────────────────────────────────────")}`);
    console.log(`  ${left}${padding}${right}\n`);
  }

  /**
   * Full markdown formatter matching Antigravity CLI typography:
   * - Electric purple headers with subtle underline rules
   * - Clean bold terms
   * - Inline code tags
   * - Code blocks with line numbers and syntax framing
   */
  static formatMarkdown(markdown: string): string {
    let formatted = markdown;

    const h1 = chalk.hex("#C792EA").bold;
    const h2 = chalk.hex("#82AAFF").bold;
    const h3 = chalk.hex("#C792EA").bold;
    const h3Underline = chalk.hex("#C792EA")("───────");
    const codeInline = chalk.hex("#FFCB6B");
    const bullet = chalk.hex("#89DDFF");
    const numberBullet = chalk.hex("#C3E88D");

    // Headers with Antigravity underline style
    formatted = formatted.replace(/^### (.*$)/gim, (_, text) => `\n  ${h3(`### ${text}`)}\n  ${h3Underline}`);
    formatted = formatted.replace(/^## (.*$)/gim, (_, text) => `\n  ${h2(`## ${text}`)}`);
    formatted = formatted.replace(/^# (.*$)/gim, (_, text) => `\n  ${h1(`# ${text}`)}`);

    // Bold & Inline Code
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, chalk.hex("#FFFFFF").bold("$1"));
    formatted = formatted.replace(/`([^`]+)`/g, (_, code) => codeInline(code));

    // Bullet points & numbering
    formatted = formatted.replace(/^\s*[-*]\s+(.*$)/gim, `  ${bullet("•")} $1`);
    formatted = formatted.replace(/^\s*(\d+)\.\s+(.*$)/gim, (_, num, text) => `  ${numberBullet(`${num}.`)} ${text}`);

    // Clean code blocks
    formatted = formatted.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const langUpper = lang ? lang.toUpperCase() : "CODE";
      const langBadge = chalk.hex("#EEFFFF").bgHex("#292D3E").bold(` ${langUpper} `);
      const border = chalk.hex("#3B4261");

      const codeLines = code.trim().split("\n");
      const indented = codeLines
        .map((line: string, idx: number) => {
          const lineNum = chalk.hex("#4F5676")(`${String(idx + 1).padStart(3, " ")} │ `);
          return `  ${border("│")} ${lineNum}${chalk.hex("#EEFFFF")(line)}`;
        })
        .join("\n");

      return `\n  ${border("╭─")} ${langBadge} ${border("──────────────────────────────────────────")}\n${indented}\n  ${border("╰──────────────────────────────────────────────────")}\n`;
    });

    return formatted;
  }

  /**
   * Renders a visual directory file tree.
   */
  static renderFileTree(files: Array<{ path: string; lines?: number }>, maxFiles: number = 40): void {
    const dim = chalk.hex("#4F5676");
    const folderColor = chalk.hex("#82AAFF").bold;
    const fileColor = chalk.hex("#EEFFFF");
    const countColor = chalk.hex("#676E95");

    console.log(`\n  ${chalk.hex("#82AAFF").bold("◈ Codebase File Tree")} ${dim(`(${files.length} indexed files)`)}:`);
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
      console.log(`  ${dim("...")} ${chalk.hex("#676E95")(`and ${files.length - maxFiles} more files`)}`);
    }
    console.log(`  ${dim("──────────────────────────────────────────────────")}\n`);
  }

  /**
   * Renders the help menu inside REPL.
   */
  static renderHelp(): void {
    const cmd = chalk.hex("#82AAFF").bold;
    const desc = chalk.hex("#676E95");
    const dim = chalk.hex("#3B4261");

    console.log(`
  ${chalk.hex("#EEFFFF").bold("Commands:")}
  ${dim("──────────────────────────────────────────────────────────")}
    ${cmd("/index")}       ${desc("Re-scan and index codebase on the fly")}
    ${cmd("/tree")}        ${desc("View visual directory file tree")}
    ${cmd("/status")}      ${desc("View indexed files, symbols, chunks & models")}
    ${cmd("/files")}       ${desc("List indexed source files")}
    ${cmd("/config")}      ${desc("View active API keys and model configurations")}
    ${cmd("/clear")}       ${desc("Clear the terminal screen")}
    ${cmd("/help")}        ${desc("Show this command reference")}
    ${cmd("/exit")}        ${desc("Exit the chat session")}

  ${chalk.hex("#EEFFFF").bold("Examples:")}
  ${dim("──────────────────────────────────────────────────────────")}
    • "what does this project do?"
    • "explain the authentication flow"
    • "where is the database connection configured?"
    • "trace all callers of the payment processing service"
`);
  }
}
