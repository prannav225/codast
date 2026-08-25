export class CodebaseAIError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "CodebaseAIError";
  }
}

export class NoProjectDetectedError extends CodebaseAIError {
  constructor(path?: string) {
    super(
      `No supported JavaScript/TypeScript project was detected${path ? ` in ${path}` : ""}.\nPlease run this command inside a project directory (containing package.json or supported source files).`,
      "NO_PROJECT_DETECTED"
    );
  }
}

export class NotInitializedError extends CodebaseAIError {
  constructor() {
    super(
      "Kodast has not been initialized in this project.\nRun: kodast init",
      "NOT_INITIALIZED"
    );
  }
}

export class NotIndexedError extends CodebaseAIError {
  constructor() {
    super(
      "No codebase index found.\nRun: kodast index",
      "NOT_INDEXED"
    );
  }
}

export class MissingApiKeyError extends CodebaseAIError {
  constructor() {
    super(
      "Gemini API key is not configured.\nProvide it via environment variable (GEMINI_API_KEY) or run:\n  kodast config set api-key <YOUR_API_KEY>",
      "MISSING_API_KEY"
    );
  }
}

export class ParserError extends CodebaseAIError {
  constructor(filePath: string, details: string) {
    super(
      `Failed to parse ${filePath}: ${details}`,
      "PARSER_ERROR"
    );
  }
}
