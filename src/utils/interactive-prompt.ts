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
   * Prompts the user with live inline suggestion popup when typing `@` or `/`.
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

      // Put stdin into raw mode
      const isRaw = process.stdin.isRaw;
      if (process.stdin.setRawMode) {
        process.stdin.setRawMode(true);
      }
      process.stdin.resume();
      readline.emitKeypressEvents(process.stdin);

      const updateSuggestions = () => {
        // Find if cursor is currently within an `@` or `/` token
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
        // Clear down from prompt
        process.stdout.write(`\r\x1b[K${promptPrefix}${buffer}`);

        // Save position of prompt cursor
        process.stdout.write(`\x1b[s`);

        if (isSuggesting && suggestions.length > 0) {
          const rule = chalk.hex("#3B4261");
          const dim = chalk.hex("#676E95");
          const cyan = chalk.hex("#89DDFF");
          const blue = chalk.hex("#82AAFF");
          const white = chalk.hex("#EEFFFF");

          let popup = `\n  ${rule("─────────────────────────────────────────────────────────────────────────────")}\n`;

          const total = suggestions.length;
          const visible = suggestions.slice(scrollOffset, scrollOffset + visibleCount);

          if (scrollOffset > 0) {
            popup += `  ${dim(`↑ ${scrollOffset} more`)}\n`;
          } else {
            popup += `\n`;
          }

          visible.forEach((item, idx) => {
            const actualIdx = scrollOffset + idx;
            const isSelected = actualIdx === selectedIndex;

            const nameCol = item.name.padEnd(26, " ");
            const typeCol = item.type.padEnd(12, " ");
            const detailCol = item.detail.slice(0, 48);

            if (isSelected) {
              popup += `  ${cyan(">")} ${blue.bold(nameCol)} ${white(typeCol)} ${dim(detailCol)}\n`;
            } else {
              popup += `    ${white(nameCol)} ${dim(typeCol)} ${dim(detailCol)}\n`;
            }
          });

          const remainingBelow = total - (scrollOffset + visible.length);
          if (remainingBelow > 0) {
            popup += `  ${dim(`↓ ${remainingBelow} more`)}\n`;
          } else {
            popup += `\n`;
          }

          popup += `\n  ${cyan("↑/↓")} ${dim("Navigate")} ${dim("•")} ${cyan("enter")} ${dim("Select")} ${dim("•")} ${cyan("tab")} ${dim("Complete")}\n`;

          process.stdout.write(popup);
        } else {
          // Clear any dangling menu lines below
          process.stdout.write(`\n\x1b[J`);
        }

        // Restore prompt cursor position
        process.stdout.write(`\x1b[u`);
        // Position cursor at right spot in buffer
        const promptLen = 2; // "> "
        process.stdout.write(`\x1b[${promptLen + cursor + 1}G`);
      };

      const cleanup = () => {
        process.stdin.removeListener("keypress", onKeypress);
        if (process.stdin.setRawMode) {
          process.stdin.setRawMode(isRaw || false);
        }
        process.stdout.write(`\n\x1b[J`);
      };

      const onKeypress = (str: string, key: any) => {
        if (!key) {
          if (str) {
            buffer = buffer.slice(0, cursor) + str + buffer.slice(cursor);
            cursor += str.length;
            updateSuggestions();
            render();
          }
          return;
        }

        // Ctrl+C
        if (key.ctrl && key.name === "c") {
          cleanup();
          console.log(chalk.hex("#89DDFF")("\n\n👋 Have a productive day, Sir!\n"));
          process.exit(0);
        }

        // Ctrl+D (EOF)
        if (key.ctrl && key.name === "d") {
          cleanup();
          resolve("/exit");
          return;
        }

        // Arrow Navigation in Suggestion Menu
        if (isSuggesting && suggestions.length > 0) {
          if (key.name === "up") {
            if (selectedIndex > 0) {
              selectedIndex--;
              if (selectedIndex < scrollOffset) {
                scrollOffset = selectedIndex;
              }
            }
            render();
            return;
          }

          if (key.name === "down") {
            if (selectedIndex < suggestions.length - 1) {
              selectedIndex++;
              if (selectedIndex >= scrollOffset + visibleCount) {
                scrollOffset = selectedIndex - visibleCount + 1;
              }
            }
            render();
            return;
          }

          if (key.name === "tab" || (key.name === "return" && isSuggesting)) {
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

          if (key.name === "escape") {
            isSuggesting = false;
            suggestions = [];
            render();
            return;
          }
        }

        // Standard Navigation & Editing
        if (key.name === "return") {
          cleanup();
          process.stdout.write("\n");
          resolve(buffer);
          return;
        }

        if (key.name === "backspace") {
          if (cursor > 0) {
            buffer = buffer.slice(0, cursor - 1) + buffer.slice(cursor);
            cursor--;
            updateSuggestions();
          }
          render();
          return;
        }

        if (key.name === "delete") {
          if (cursor < buffer.length) {
            buffer = buffer.slice(0, cursor) + buffer.slice(cursor + 1);
            updateSuggestions();
          }
          render();
          return;
        }

        if (key.name === "left") {
          if (cursor > 0) {
            cursor--;
            updateSuggestions();
          }
          render();
          return;
        }

        if (key.name === "right") {
          if (cursor < buffer.length) {
            cursor++;
            updateSuggestions();
          }
          render();
          return;
        }

        if (key.name === "home") {
          cursor = 0;
          updateSuggestions();
          render();
          return;
        }

        if (key.name === "end") {
          cursor = buffer.length;
          updateSuggestions();
          render();
          return;
        }

        // Printable input
        if (str && !key.ctrl && !key.meta) {
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
