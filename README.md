# Codast (`codast` / `cai`)

> **Local-first AI-powered developer CLI for JavaScript, TypeScript, Python, Go, Rust, Java, C/C++, and Polyglot codebases.**  
> Deep AST analysis, dependency graph resolution, local vector retrieval, and grounded reasoning with exact line citations.

---

## Features

- **Interactive Terminal REPL (`codast` / `cai`)**: Launch directly into an interactive conversation with continuous multi-turn dialogue, slash commands (`/index`, `/status`, `/files`, `/config`), and syntax-highlighted markdown formatting.
- **Universal Multi-Language Support**:
  - **JavaScript & TypeScript** (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`) — Full AST parsing via `ts-morph` (React components, hooks, interfaces, types)
  - **Python** (`.py`, `.pyi`) — Classes, methods, async defs, decorators, docstrings, imports
  - **Go** (`.go`) — Structs, interfaces, receiver methods `(r *Type)`, packages, imports
  - **Rust** (`.rs`) — Structs, enums, traits, `impl` blocks, `pub fn`, `use` statements
  - **Java & Kotlin** (`.java`, `.kt`) — Classes, interfaces, records, methods, annotations
  - **C / C++ / C#** (`.c`, `.cpp`, `.h`, `.hpp`, `.cs`) — Functions, classes, structs, namespaces, `#include`
  - **PHP & Ruby** (`.php`, `.rb`) — Classes, methods, modules, functions, `require`/`use`
  - **Data & Config** (`.sql`, `.json`, `.yaml`, `.md`, `.html`, `.css`) — SQL tables/views, Markdown section blocks, JSON/YAML configurations
- **Relational Dependency Graphs**: Traces `IMPORTS`, `EXPORTS`, `DEFINES`, `CALLS`, and `USES` relationships stored in local SQLite.
- **Language-Native Code Chunking**: Enriches chunks with file paths, symbol signatures, docstrings, and language-specific comment formats (`#`, `//`, `--`).
- **Multi-Provider Embedding Engine**: High-throughput code embeddings with **Voyage AI** (`voyage-code-2`) or **Google Gemini** (`gemini-embedding-001`), combined with **Gemini 3.1 Flash Lite** for grounded reasoning.
- **Exact Line Citations**: Every answer provides clickable file and line-range evidence (e.g. `src/services/auth.ts:14-48`).
- **Incremental Caching**: SHA-256 content hashing skips unchanged files (sub-second re-indexing).

---

## Installation

### Method 1: Global Install via NPM

```bash
npm install -g @pra9v/codast
```

### Method 2: Zero-Install Instant Run (npx)

```bash
npx @pra9v/codast
```

### Method 3: One-Liner Curl Installer

```bash
curl -fsSL https://raw.githubusercontent.com/prannav225/codast/main/install.sh | bash
```

### Method 4: Build from Source

```bash
git clone https://github.com/prannav225/codast.git
cd codast
npm install
npm run build
npm link
```

---

## Configuration

Codast stores your API keys globally in `~/.codebase-ai/config.json` so you configure them once and use them across all repositories on your machine:

```bash
# Configure Gemini API key (for grounded reasoning)
codast config set api-key <YOUR_GEMINI_KEY>

# Configure Voyage AI API key (for code embeddings)
codast config set voyage-key <YOUR_VOYAGE_KEY>

# Optional: Switch embedding provider ('voyage' or 'gemini')
codast config set provider voyage
```

---

## Usage

### Interactive Chat Session

Navigate to any codebase and run:

```bash
codast
# or
cai
```

Inside the interactive REPL:
```text
my_project ❯ explain the authentication flow
my_project ❯ where is the database connection configured?
my_project ❯ what are the main components and how do they interact?
```

### Slash Commands

| Command | Action |
| :--- | :--- |
| `/index` | Re-scans and indexes the codebase on the fly |
| `/status` | Displays repository metrics, files, symbols, and chunks |
| `/files` | Lists all indexed source files |
| `/config` | Views active API keys and model configurations |
| `/clear` | Clears the terminal screen |
| `/help` | Displays command cheatsheet |
| `/exit` | Exits the interactive session |

---

### Command Line Interface

```bash
# Initialize local storage (.codebase-ai) in current directory
codast init

# Index the codebase
codast index [--force] [--verbose]

# View index status and metrics
codast status

# Ask a one-off question from terminal
codast ask "How does user authentication work?"
```

---

## Architecture

```text
Source Files (TS/JS/Python/Go/Rust/Java/C++/SQL)
      │
      ├──> Polyglot AST Engine ──> SQLite (Symbols & Relational Call Graphs)
      │
      └──> Logical Chunker ─────> Voyage AI / Gemini Embeddings ──> LanceDB Vector Store
                                                                         │
                                                                         ▼
User Query ──> Hybrid Retrieval (Symbols + Call Graphs + Vectors) ──> Gemini 3.1 Reasoning
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

Includes unit and integration test suites:
- Repository Scanner & Ignore Filters (`tests/scanner.test.ts`)
- AST Symbol & Relationship Extraction (`tests/ast-parser.test.ts`)
- SQLite Structured Metadata Storage (`tests/sqlite.test.ts`)
- Logical Code Chunking (`tests/chunker.test.ts`)
- LanceDB Vector Store (`tests/vector.test.ts`)
- Hybrid Multi-Modal Retrieval Engine (`tests/retrieval.test.ts`)
- Multi-Language AST Extraction & Parsing (`tests/multi-lang.test.ts`)

---

## License

MIT © Pranav
