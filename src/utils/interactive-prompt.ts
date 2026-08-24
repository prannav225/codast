import path from "node:path";
import readline from "node:readline";
import chalk from "chalk";

export interface SuggestionItem {
  name: string;
  type: "File" | "Directory" | "Symbol" | "Command";
  detail: string;
  insertValue: string;
}

export class InteractivePrompt {
  private readonly projectRoot: string;
  private readonly getCandidates: () => SuggestionItem[];

  constructor(projectRoot: string, getCandidates: () => SuggestionItem[]) {
    this.projectRoot = path.resolve(projectRoot);
    this.getCandidates = getCandidates;
  }

  /**
   * Prompts the user with a rock-solid, zero-scroll inline suggestion popup when typing `@` or `/`.
   */
  async ask(promptPrefix: string = "> "): Promise<string> {
    return new Promise((resolve) => {
      let buffer = "";
      let cursor = 0;
      let selectedIndex = 0;
      let scrollOffset = 0;
      const visibleCount = 5;

      let suggestions: SuggestionItem[] = [];
      let isSuggesting = false;
      let mentionStartIndex = -1;

      const isRaw = process.stdin.isRaw;
      if (process.stdin.setRawMode) {
        process.stdin.setRawMode(true);
      }
      process.stdin.resume();
      readline.emitKeypressEvents(process.stdin);

      const updateSuggestions = () => {
        const textBeforeCursor = buffer.slice(0, cursor);
        const lastAt = textBeforeCursor.lastIndexOf("@");
        const lastSlash = textBeforeCursor.startsWith("/") && !textBeforeCursor.includes(" ") ? 0 : -1;

        if (lastAt !== -1 && (lastAt === 0 || /\s/.test(buffer[lastAt - 1]))) {
          isSuggesting = true;
          mentionStartIndex = lastAt;
          const query = textBeforeCursor.slice(lastAt + 1).toLowerCase();
          const all = this.getCandidates();
          suggestions = all.filter(c =>
            c.name.toLowerCase().includes(query) ||
            c.detail.toLowerCase().includes(query)
          );
          selectedIndex = Math.min(selectedIndex, Math.max(0, suggestions.length - 1));
          scrollOffset = Math.min(scrollOffset, Math.max(0, suggestions.length - visibleCount));
          return;
        }

        if (lastSlash === 0) {
          isSuggesting = true;
          mentionStartIndex = 0;
          const query = textBeforeCursor.toLowerCase();
          const all = this.getCandidates().filter(c => c.type === "Command");
          suggestions = all.filter(c => c.name.toLowerCase().startsWith(query));
          selectedIndex = Math.min(selectedIndex, Math.max(0, suggestions.length - 1));
          scrollOffset = Math.min(scrollOffset, Math.max(0, suggestions.length - visibleCount));
          return;
        }

        isSuggesting = false;
        suggestions = [];
        selectedIndex = 0;
        scrollOffset = 0;
      };

      const render = () => {
        const plainPromptLen = promptPrefix.replace(/\u001b\[[0-9;]*m/g, "").length;

        // Build popup lines
        const popupLines: string[] = [];

        if (isSuggesting && suggestions.length > 0) {
          const rule = chalk.hex("#3B4261");
          const dim = chalk.hex("#676E95");
          const cyan = chalk.hex("#89DDFF");
          const blue = chalk.hex("#82AAFF");
          const white = chalk.hex("#EEFFFF");

          popupLines.push(`  ${rule("─────────────────────────────────────────────────────────────────────────────")}`);

          const total = suggestions.length;
          const visible = suggestions.slice(scrollOffset, scrollOffset + visibleCount);

          if (scrollOffset > 0) {
            popupLines.push(`  ${dim(`↑ ${scrollOffset} more`)}`);
          } else {
            popupLines.push("");
          }

          visible.forEach((item, idx) => {
            const actualIdx = scrollOffset + idx;
            const isSelected = actualIdx === selectedIndex;

            const nameCol = item.name.padEnd(24, " ");
            const typeCol = item.type.padEnd(10, " ");
            const detailCol = item.detail.slice(0, 46);

            if (isSelected) {
              popupLines.push(`  ${cyan(">")} ${blue.bold(nameCol)} ${white(typeCol)} ${dim(detailCol)}`);
            } else {
              popupLines.push(`    ${white(nameCol)} ${dim(typeCol)} ${dim(detailCol)}`);
            }
          });

          const remainingBelow = total - (scrollOffset + visible.length);
          if (remainingBelow > 0) {
            popupLines.push(`  ${dim(`↓ ${remainingBelow} more`)}`);
          } else {
            popupLines.push("");
          }

          popupLines.push(`  ${cyan("↑/↓")} ${dim("Navigate")} ${dim("•")} ${cyan("enter")} ${dim("Select")} ${dim("•")} ${cyan("tab")} ${dim("Complete")}`);
        }

        // 1. Move to col 0 of prompt line and clear down from prompt line to bottom of screen
        let out = `\r\x1b[J`;

        // 2. Write prompt line + popup lines
        const allLines = [`${promptPrefix}${buffer}`, ...popupLines];
        out += allLines.join("\n");

        // 3. Move cursor back up from bottom line to prompt line
        const extraLines = allLines.length - 1;
        if (extraLines > 0) {
          out += `\x1b[${extraLines}A`;
        }

        // 4. Place cursor at current buffer position on prompt line
        out += `\r\x1b[${plainPromptLen + cursor + 1}G`;

        process.stdout.write(out);
      };

      const cleanup = () => {
        process.stdin.removeListener("keypress", onKeypress);
        if (process.stdin.setRawMode) {
          process.stdin.setRawMode(isRaw || false);
        }

        // Clear prompt line and any popup below it, then print final submitted line
        let out = `\r\x1b[J`;
        out += `${promptPrefix}${buffer}\n`;
        process.stdout.write(out);
      };

      const onKeypress = (str: string, key: any) => {
        // Ctrl+C
        if (key && key.ctrl && key.name === "c") {
          cleanup();
          console.log(chalk.hex("#89DDFF")("\n\n👋 Have a productive day, Sir!\n"));
          process.exit(0);
        }

        // Ctrl+D (EOF)
        if (key && key.ctrl && key.name === "d") {
          cleanup();
          resolve("/exit");
          return;
        }

        // Arrow Navigation in Suggestion Menu
        if (isSuggesting && suggestions.length > 0) {
          if (key && key.name === "up") {
            if (selectedIndex > 0) {
              selectedIndex--;
              if (selectedIndex < scrollOffset) {
                scrollOffset = selectedIndex;
              }
            }
            render();
            return;
          }

          if (key && key.name === "down") {
            if (selectedIndex < suggestions.length - 1) {
              selectedIndex++;
              if (selectedIndex >= scrollOffset + visibleCount) {
                scrollOffset = selectedIndex - visibleCount + 1;
              }
            }
            render();
            return;
          }

          if (key && (key.name === "tab" || key.name === "return")) {
            const chosen = suggestions[selectedIndex];
            if (chosen) {
              const beforeMention = buffer.slice(0, mentionStartIndex);
              const afterCursor = buffer.slice(cursor);
              const inserted = chosen.insertValue;
              buffer = `${beforeMention}${inserted} ${afterCursor}`;
              cursor = (beforeMention + inserted).length + 1;
              isSuggesting = false;
              suggestions = [];
              render();
              return;
            }
          }

          if (key && key.name === "escape") {
            isSuggesting = false;
            suggestions = [];
            render();
            return;
          }
        }

        // Standard Navigation & Editing
        if (key && key.name === "return") {
          cleanup();
          resolve(buffer);
          return;
        }

        if (key && key.name === "backspace") {
          if (cursor > 0) {
            buffer = buffer.slice(0, cursor - 1) + buffer.slice(cursor);
            cursor--;
            updateSuggestions();
          }
          render();
          return;
        }

        if (key && key.name === "delete") {
          if (cursor < buffer.length) {
            buffer = buffer.slice(0, cursor) + buffer.slice(cursor + 1);
            updateSuggestions();
          }
          render();
          return;
        }

        if (key && key.name === "left") {
          if (cursor > 0) {
            cursor--;
            updateSuggestions();
          }
          render();
          return;
        }

        if (key && key.name === "right") {
          if (cursor < buffer.length) {
            cursor++;
            updateSuggestions();
          }
          render();
          return;
        }

        if (key && key.name === "home") {
          cursor = 0;
          updateSuggestions();
          render();
          return;
        }

        if (key && key.name === "end") {
          cursor = buffer.length;
          updateSuggestions();
          render();
          return;
        }

        // Printable input
        if (str && (!key || (!key.ctrl && !key.meta))) {
          buffer = buffer.slice(0, cursor) + str + buffer.slice(cursor);
          cursor += str.length;
          updateSuggestions();
          render();
        }
      };

      process.stdin.on("keypress", onKeypress);
      render();
    });
  }
}
