import { createProgram } from "./program.js";
import { Logger } from "../utils/logger.js";
import { CodebaseAIError } from "../utils/errors.js";

async function main() {
  const program = createProgram();

  try {
    await program.parseAsync(process.argv);
  } catch (error: any) {
    if (error instanceof CodebaseAIError) {
      Logger.error(error.message);
    } else {
      Logger.error(`Unexpected error: ${error.message || error}`);
      if (Logger.isVerbose() && error.stack) {
        console.error(error.stack);
      }
    }
    process.exit(1);
  }
}

main();
