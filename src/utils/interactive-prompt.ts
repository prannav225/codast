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
   * Prompts the user with a smooth, in-place inline suggestion popup when typing `@` or `/`.
   */
  async ask(promptPrefix: string = "> "): Promise<string> {
    return new Promise((resolve) => {
      let buffer = "";
      let cursor = 0;
      let selectedIndex = 0;
      let scrollOffset = 0;
      let renderedLineCount = 0;
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
        // 1. Move cursor back up to the prompt line from any previously rendered popup lines
        if (renderedLineCount > 0) {
          readline.moveCursor(process.stdout, 0, -renderedLineCount);
        }
        readline.cursorTo(process.stdout, 0);
        readline.clearScreenDown(process.stdout);

        // 2. Build output lines
        const promptLine = `${promptPrefix}${buffer}`;
        const outputLines: string[] = [promptLine];

        if (isSuggesting && suggestions.length > 0) {
          const rule = chalk.hex("#3B4261");
          const dim = chalk.hex("#676E95");
          const cyan = chalk.hex("#89DDFF");
          const blue = chalk.hex("#82AAFF");
          const white = chalk.hex("#EEFFFF");

          outputLines.push(`  ${rule("─────────────────────────────────────────────────────────────────────────────")}`);

          const total = suggestions.length;
          const visible = suggestions.slice(scrollOffset, scrollOffset + visibleCount);

          if (scrollOffset > 0) {
            outputLines.push(`  ${dim(`↑ ${scrollOffset} more`)}`);
          } else {
            outputLines.push("");
          }

          visible.forEach((item, idx) => {
            const actualIdx = scrollOffset + idx;
            const isSelected = actualIdx === selectedIndex;

            const nameCol = item.name.padEnd(26, " ");
            const typeCol = item.type.padEnd(12, " ");
            const detailCol = item.detail.slice(0, 48);

            if (isSelected) {
              outputLines.push(`  ${cyan(">")} ${blue.bold(nameCol)} ${white(typeCol)} ${dim(detailCol)}`);
            } else {
              outputLines.push(`    ${white(nameCol)} ${dim(typeCol)} ${dim(detailCol)}`);
            }
          });

          const remainingBelow = total - (scrollOffset + visible.length);
          if (remainingBelow > 0) {
            outputLines.push(`  ${dim(`↓ ${remainingBelow} more`)}`);
          } else {
            outputLines.push("");
          }

          outputLines.push(`  ${cyan("↑/↓")} ${dim("Navigate")} ${dim("•")} ${cyan("enter")} ${dim("Select")} ${dim("•")} ${cyan("tab")} ${dim("Complete")}`);
        }

        // 3. Write all lines smoothly
        process.stdout.write(outputLines.join("\n"));

        // 4. Update rendered line count
        renderedLineCount = outputLines.length - 1;

        // 5. Move cursor back to the prompt line at the correct horizontal position
        if (renderedLineCount > 0) {
          readline.moveCursor(process.stdout, 0, -renderedLineCount);
        }
        const promptPlainLen = promptPrefix.replace(/\u001b\[[0-9;]*m/g, "").length;
        readline.cursorTo(process.stdout, promptPlainLen + cursor);
      };

      const cleanup = () => {
        process.stdin.removeListener("keypress", onKeypress);
        if (process.stdin.setRawMode) {
          process.stdin.setRawMode(isRaw || false);
        }
        if (renderedLineCount > 0) {
          readline.moveCursor(process.stdout, 0, -renderedLineCount);
        }
        readline.cursorTo(process.stdout, 0);
        readline.clearScreenDown(process.stdout);
        process.stdout.write(`${promptPrefix}${buffer}\n`);
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
