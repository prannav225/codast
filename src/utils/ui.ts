import chalk from "chalk";

export class TerminalUI {
  /**
   * Renders a refined, minimalist, modern developer header for Codast.
   */
  static renderBanner(projectName: string, stats?: { files: number; symbols: number; chunks: number }): void {
    console.clear();
    const primary = chalk.hex("#818CF8");      // Soft Indigo / Violet
    const secondary = chalk.hex("#34D399");    // Soft Emerald
    const textMain = chalk.hex("#F8FAFC");     // Crisp White
    const textMuted = chalk.hex("#94A3B8");    // Slate Gray
    const dim = chalk.hex("#475569");          // Muted Border Slate

    console.log();
    console.log(`  ${primary.bold("◆ CODAST")}  ${dim("•")}  ${textMuted("Local Code Intelligence & REPL")}`);
    console.log(`  ${dim("────────────────────────────────────────────────────────────")}`);

    if (stats) {
      const repoLabel = `${textMuted("repo:")} ${textMain.bold(projectName)}`;
      const filesLabel = `${textMuted("files:")} ${secondary.bold(stats.files)}`;
      const symLabel = `${textMuted("symbols:")} ${secondary.bold(stats.symbols)}`;
      const chunkLabel = `${textMuted("chunks:")} ${secondary.bold(stats.chunks)}`;
      console.log(`  ${repoLabel}  ${dim("│")}  ${filesLabel}  ${dim("│")}  ${symLabel}  ${dim("│")}  ${chunkLabel}`);
    } else {
      console.log(`  ${textMuted("repo:")} ${textMain.bold(projectName)}`);
    }

    console.log(`  ${dim("────────────────────────────────────────────────────────────")}`);
    console.log(`  ${textMuted("Ask anything about your code. Type")} ${primary("/help")} ${textMuted("for commands or")} ${primary("/exit")} ${textMuted("to quit.")}`);
    console.log();
  }

  /**
   * Formats markdown with soft, readable, modern typography.
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

    // Bold & Italic
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, chalk.hex("#FFFFFF").bold("$1"));
    formatted = formatted.replace(/`([^`]+)`/g, (_, code) => codeInline(code));

    // Bullet points & numbering
    formatted = formatted.replace(/^\s*[-*]\s+(.*$)/gim, `  ${bullet("•")} $1`);
    formatted = formatted.replace(/^\s*(\d+)\.\s+(.*$)/gim, (_, num, text) => `  ${numberBullet(`${num}.`)} ${text}`);

    // Clean code blocks
    formatted = formatted.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const langBadge = lang ? chalk.hex("#64748B")(` [${lang}]`) : "";
      const border = chalk.hex("#334155");
      const indented = code
        .trim()
        .split("\n")
        .map((line: string) => `  ${border("│")}  ${chalk.hex("#E2E8F0")(line)}`)
        .join("\n");

      return `\n  ${border("┌─")}${langBadge} ${border("──────────────────────────────────────")}\n${indented}\n  ${border("└────────────────────────────────────────")}\n`;
    });

    return formatted;
  }

  /**
   * Renders citations in sleek, subtle slate pill badges.
   */
  static renderSources(sources: Array<{ path: string; startLine: number; endLine: number }>): void {
    if (sources.length === 0) return;

    const header = chalk.hex("#818CF8").bold("  Sources:");
    console.log(header);
    const seen = new Set<string>();

    for (const s of sources) {
      const key = `${s.path}:${s.startLine}-${s.endLine}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const pathText = chalk.hex("#93C5FD")(s.path);
      const lineText = chalk.hex("#64748B")(`:${s.startLine}-${s.endLine}`);
      console.log(`    ${chalk.hex("#475569")("↳")} ${pathText}${lineText}`);
    }
    console.log();
  }

  /**
   * Renders the interactive command prompt symbol.
   */
  static getPrompt(projectName: string): string {
    const repoBadge = chalk.hex("#818CF8").bold(projectName);
    const arrow = chalk.hex("#34D399")("❯");
    return `${repoBadge} ${arrow} `;
  }

  /**
   * Renders the help menu inside REPL.
   */
  static renderHelp(): void {
    const cmd = chalk.hex("#818CF8");
    const desc = chalk.hex("#94A3B8");

    console.log(`
  ${chalk.hex("#F8FAFC").bold("Commands:")}
    ${cmd("/index")}      ${desc("Re-scan and index codebase with AST & embeddings")}
    ${cmd("/status")}     ${desc("View indexed files, symbols, chunks & models")}
    ${cmd("/files")}      ${desc("List indexed source files")}
    ${cmd("/config")}     ${desc("View active API keys and model configurations")}
    ${cmd("/clear")}      ${desc("Clear the terminal screen")}
    ${cmd("/exit")}       ${desc("Exit the chat session")}

  ${chalk.hex("#F8FAFC").bold("Questions:")}
    Type questions naturally:
      • "How does auth flow work in this codebase?"
      • "Where are the API routes configured?"
      • "Explain the state management architecture"
`);
  }
}
