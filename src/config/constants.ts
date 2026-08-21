export const CODEBASE_DIR_NAME = ".codebase-ai";
export const CONFIG_FILE_NAME = "config.json";
export const METADATA_DB_NAME = "metadata.db";
export const VECTORS_DIR_NAME = "vectors";

export const SUPPORTED_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"] as const;

export const DEFAULT_EXCLUDES = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/coverage/**",
  "**/.next/**",
  "**/out/**",
  "**/.cache/**",
  "**/.codebase-ai/**",
  "**/android/**",
  "**/ios/**",
  "**/www/**",
  "**/public/assets/**",
  "**/assets/public/**",
  "**/platforms/**",
  "**/.env",
  "**/.env.*",
  "**/*.min.js",
  "**/*.bundle.js",
  "**/*.d.ts",
  "**/*.d.tsx",
  "**/package-lock.json",
  "**/yarn.lock",
  "**/pnpm-lock.yaml"
];

export const DEFAULT_EMBEDDING_PROVIDER = "voyage";
export const DEFAULT_EMBEDDING_MODEL = "voyage-code-2";
export const DEFAULT_CHAT_MODEL = "gemini-3.1-flash-lite";
export const VECTOR_TABLE_NAME = "code_chunks";
