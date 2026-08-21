# Codast (`codast` / `cai`)

> **Local-first AI-powered developer CLI for JavaScript and TypeScript codebases.**  
> Deep AST analysis, dependency graph resolution, local vector retrieval, and grounded reasoning with exact line citations.

---

## Features

- **Interactive Terminal REPL (`codast` / `cai`)**: Launch into an interactive chat environment with continuous multi-turn dialogue, slash commands (`/index`, `/status`, `/files`), and syntax-highlighted markdown.
- **AST Intelligence (`ts-morph`)**: Extracts classes, methods, functions, React components, hooks, interfaces, and type aliases.
- **Relationship Graphs**: Traces `IMPORTS`, `EXPORTS`, `DEFINES`, `CALLS`, and `USES` relationships stored in local SQLite.
- **Logical Code Chunking**: Enriches code chunks with file paths, symbol metadata, signatures, and docstrings.
- **Multi-Provider Support**: High-throughput code embeddings with **Voyage AI** (`voyage-code-2`) or **Google Gemini** (`gemini-embedding-001`), paired with **Gemini 3.1 Flash Lite** for grounded reasoning.
- **Exact Source Citations**: Every answer includes clickable file and line-range evidence (e.g. `src/auth.ts:12-45`).
- **Incremental Caching**: SHA-256 content hashing skips unchanged files (re-indexes in 0.02s).

---

## Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/prannav225/codast.git
cd codast

# Install dependencies & build
npm install
npm run build

# Link globally to your terminal
npm link
```

### 2. Configure API Keys

Codast saves your API keys globally to `~/.codebase-ai/config.json` so you never have to re-enter them in new projects:

```bash
# Set your Gemini API key (for grounded reasoning)
codast config set api-key <YOUR_GEMINI_KEY>

# Set your Voyage AI key (for 200M free code embeddings)
codast config set voyage-key <YOUR_VOYAGE_KEY>
```

---

## Usage

### Interactive Chat Session

Navigate to any JavaScript or TypeScript project and run:

```bash
codast
# or
cai
```

Inside the REPL, simply ask questions naturally:
```text
pocket_ledger ❯ explain the auth flow
pocket_ledger ❯ where is the database connection configured?
pocket_ledger ❯ what are the main components and how do they interact?
```

### In-Chat Slash Commands

| Command | Action |
| :--- | :--- |
| `/index` | Re-scans and indexes the codebase on the fly |
| `/status` | Displays repository metrics, files, symbols, and chunks |
| `/files` | Lists all indexed source files |
| `/config` | Views active API keys and model configurations |
| `/clear` | Clears terminal screen |
| `/help` | Displays command cheatsheet |
| `/exit` | Exits the interactive session |

---

### Command Line Interface

```bash
# Initialize local storage (.codebase-ai) in current project
codast init

# Index the codebase
codast index [--force] [--verbose]

# View index status & metrics
codast status

# One-off question from terminal
codast ask "How does user authentication work?"
```

---

## Architecture

```text
Source Files (JS/TS)
      │
      ├──> ts-morph AST Parser ──> SQLite (Symbols & Dependency Graphs)
      │
      └──> Logical Chunker ─────> Voyage AI Embeddings ──> LanceDB Vector Store
                                                                │
                                                                ▼
User Query ──> Hybrid Retrieval (Symbols + Graphs + Vectors) ──> Gemini Reasoning
                                                                │
                                                                ▼
                                                 Grounded Answer + Citations
```

---

## Testing

Run the automated test suite across all subsystems:

```bash
npm test
```

Includes unit & integration tests for:
- Repository Scanner & Ignore Filters (`tests/scanner.test.ts`)
- AST Symbol & Relationship Extraction (`tests/ast-parser.test.ts`)
- SQLite Structured Metadata Storage (`tests/sqlite.test.ts`)
- Logical Code Chunking (`tests/chunker.test.ts`)
- LanceDB Vector Store (`tests/vector.test.ts`)
- Hybrid Multi-Modal Retrieval Engine (`tests/retrieval.test.ts`)

---

## License

MIT © Pranav
