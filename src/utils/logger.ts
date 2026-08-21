import chalk from "chalk";
import ora, { type Ora } from "ora";

export class Logger {
  private static verboseEnabled = false;

  static setVerbose(enabled: boolean) {
    this.verboseEnabled = enabled;
  }

  static isVerbose(): boolean {
    return this.verboseEnabled;
  }

  static info(message: string) {
    console.log(chalk.blue("ℹ ") + message);
  }

  static success(message: string) {
    console.log(chalk.green("✔ ") + message);
  }

  static warn(message: string) {
    console.log(chalk.yellow("⚠ ") + message);
  }

  static error(message: string) {
    console.error(chalk.red("✖ ") + message);
  }

  static debug(prefix: string, message: string) {
    if (this.verboseEnabled) {
      console.log(chalk.dim(`[${prefix}] ${message}`));
    }
  }

  static spinner(text: string): Ora {
    return ora({
      text,
      color: "cyan"
    }).start();
  }

  static heading(text: string) {
    console.log("\n" + chalk.bold.cyan(text));
  }

  static divider() {
    console.log(chalk.dim("─".repeat(50)));
  }
}
