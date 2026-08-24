import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";

export const PIXEL_SPINNER = {
  interval: 80,
  frames: [
    chalk.hex("#89DDFF")("⠋"),
    chalk.hex("#89DDFF")("⠙"),
    chalk.hex("#82AAFF")("⠹"),
    chalk.hex("#82AAFF")("⠸"),
    chalk.hex("#C792EA")("⠼"),
    chalk.hex("#C792EA")("⠴"),
    chalk.hex("#82AAFF")("⠦"),
    chalk.hex("#82AAFF")("⠧"),
    chalk.hex("#89DDFF")("⠇"),
    chalk.hex("#89DDFF")("⠏")
  ]
};

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
   * Renders the iconic 4-row 1:1 ratio square pixel banner with metadata.
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
    console.log();
    // 4-row pixel square logo with continuous diagonal cascade gradient
    console.log(`  ${coral("▄▄")}${amber("▄▄")}      ${title("Codast CLI 0.2.0")}`);
    console.log(`  ${amber("██")}${emerald("██")}      ${textMuted(`Local Code Intelligence & REPL`)}`);
    console.log(`  ${emerald("██")}${cyan("██")}      ${textMain(`Neural AST & Semantic Index Active`)}`);
    console.log(`  ${cyan("▀▀")}${purple("▀▀")}      ${textMuted(`${projectRoot}${branchInfo}`)}`);
    console.log(`  ${rule("─────────────────────────────────────────────────────────────────────────────")}`);
    console.log();
  }

  /**
   * Renders the clean minimal Antigravity prompt.
   */
  static getPrompt(): string {
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
  static renderThoughtHeader(durationSeconds: number, tokenCount?: number): void {
    const arrow = chalk.hex("#676E95")("▸");
    const tokens = tokenCount ? `, ${tokenCount.toLocaleString()} tokens` : "";
    const thoughtText = chalk.hex("#676E95").italic(`Thought for ${durationSeconds.toFixed(1)}s${tokens}`);
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

    const header = chalk.hex("#C792EA").bold("Sources & Evidence:");
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
  static renderBottomBar(status: string = "codast • ready"): void {
    const rule = chalk.hex("#3B4261");
    const left = chalk.hex("#676E95")("? for shortcuts");
    const right = chalk.hex("#676E95")(status);
    const width = 77;
    const padding = " ".repeat(Math.max(1, width - left.length - right.length));

    console.log(`\n  ${rule("─────────────────────────────────────────────────────────────────────────────")}`);
    console.log(`  ${left}${padding}${right}\n`);
  }

  /**
   * Complete, clean terminal markdown renderer:
   * Strips all raw markdown symbols (*, **, ###, ```) and replaces with beautiful ANSI typography.
   */
  static formatMarkdown(markdown: string): string {
    const lines = markdown.split("\n");
    const outputLines: string[] = [];
    let inCodeBlock = false;
    let codeLang = "";
    let codeBuffer: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const trimmed = rawLine.trim();

      // 1. Code Block fences
      if (trimmed.startsWith("```")) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLang = trimmed.replace(/^```/, "").trim();
          codeBuffer = [];
        } else {
          inCodeBlock = false;
          const langUpper = codeLang ? codeLang.toUpperCase() : "CODE";
          const border = chalk.hex("#3B4261");
          const langBadge = chalk.hex("#EEFFFF").bgHex("#292D3E").bold(` ${langUpper} `);

          outputLines.push(`  ${border("╭─")} ${langBadge} ${border("──────────────────────────────────────────")}`);
          codeBuffer.forEach((cLine, cIdx) => {
            const lineNum = chalk.hex("#4F5676")(`${String(cIdx + 1).padStart(3, " ")} │ `);
            outputLines.push(`  ${border("│")} ${lineNum}${chalk.hex("#EEFFFF")(cLine)}`);
          });
          outputLines.push(`  ${border("╰──────────────────────────────────────────────────")}`);
          codeBuffer = [];
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(rawLine);
        continue;
      }

      // 2. Headers
      if (rawLine.startsWith("### ")) {
        const title = rawLine.replace(/^###\s+/, "").trim();
        outputLines.push("");
        outputLines.push(`  ${chalk.hex("#C792EA").bold(`### ${title}`)}`);
        outputLines.push(`  ${chalk.hex("#C792EA")("───────")}`);
        continue;
      }

      if (rawLine.startsWith("## ")) {
        const title = rawLine.replace(/^##\s+/, "").trim();
        outputLines.push("");
        outputLines.push(`  ${chalk.hex("#82AAFF").bold(`## ${title}`)}`);
        continue;
      }

      if (rawLine.startsWith("# ")) {
        const title = rawLine.replace(/^#\s+/, "").trim();
        outputLines.push("");
        outputLines.push(`  ${chalk.hex("#C792EA").bold(`# ${title}`)}`);
        continue;
      }

      // 3. Horizontal Dividers
      if (trimmed === "---" || trimmed === "___" || trimmed === "***") {
        outputLines.push(`  ${chalk.hex("#3B4261")("─────────────────────────────────────────────────────────────────────────────")}`);
        continue;
      }

      // 4. Line Formatting: Lists, Numbers, Bold, Italic, Inline Code
      let line = rawLine;

      // Unordered list item: "- " or "* " or "  * "
      const bulletMatch = line.match(/^(\s*)[*-]\s+(.*)$/);
      if (bulletMatch) {
        const indent = bulletMatch[1];
        const content = this.cleanInlineMarkdown(bulletMatch[2]);
        const bullet = chalk.hex("#89DDFF")("•");
        outputLines.push(`  ${indent}${bullet} ${content}`);
        continue;
      }

      // Ordered list item: "1. " or "  1. "
      const numberMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
      if (numberMatch) {
        const indent = numberMatch[1];
        const num = numberMatch[2];
        const content = this.cleanInlineMarkdown(numberMatch[3]);
        const numStyled = chalk.hex("#C3E88D")(`${num}.`);
        outputLines.push(`  ${indent}${numStyled} ${content}`);
        continue;
      }

      // Standard text line
      outputLines.push(`  ${this.cleanInlineMarkdown(line)}`);
    }

    return outputLines.join("\n");
  }

  /**
   * Cleans and ANSI-styles inline markdown elements (bold, italic, code, quotes).
   */
  private static cleanInlineMarkdown(text: string): string {
    let res = text;

    // Bold: **text** or __text__
    res = res.replace(/\*\*(.*?)\*\*/g, (_, match) => chalk.bold.hex("#FFFFFF")(match));
    res = res.replace(/__(.*?)__/g, (_, match) => chalk.bold.hex("#FFFFFF")(match));

    // Italic: *text* or _text_ (single asterisk/underscore, not preceded/followed by asterisk)
    res = res.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, (_, match) => chalk.italic.hex("#EEFFFF")(match));
    res = res.replace(/(?<!_)_([^_]+)_(?!_)/g, (_, match) => chalk.italic.hex("#EEFFFF")(match));

    // Inline Code: `code`
    res = res.replace(/`([^`]+)`/g, (_, code) => chalk.hex("#FFCB6B").bgHex("#1E2233")(` ${code} `));

    // Clean any orphaned list asterisks or artifacts at the start of text
    res = res.replace(/^\*\s+/, "");

    return res;
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
    ${cmd("/diagram")}     ${desc("Generate Mermaid/ASCII architecture diagrams (/diagram [target])")}
    ${cmd("/tree")}        ${desc("View visual directory file tree")}
    ${cmd("/status")}      ${desc("View indexed files, symbols, chunks & models")}
    ${cmd("/files")}       ${desc("List indexed source files")}
    ${cmd("/reset")}       ${desc("Clear conversation memory")}
    ${cmd("/config")}      ${desc("View active API keys and model configurations")}
    ${cmd("/clear")}       ${desc("Clear the terminal screen and reset history")}
    ${cmd("/help")}        ${desc("Show this command reference")}
    ${cmd("/exit")}        ${desc("Exit the chat session")}

  ${chalk.hex("#EEFFFF").bold("Examples & @Mentions:")}
  ${dim("──────────────────────────────────────────────────────────")}
    • "@src/services/auth.ts explain the authentication flow"
    • "how does @RepositoryScanner work with @filters.ts?"
    • "/diagram auth"
    • "what happens if the session expires? (remembers context)"
`);
  }
}
