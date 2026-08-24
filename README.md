# Codast (`codast` / `cai`)

<p align="center">
  <img src="assets/codast-icon.svg" alt="Codast Logo" width="128" height="128" />
</p>

<p align="center">
  <strong>Local-first, AI-powered developer CLI and intelligence engine for multi-language codebases.</strong><br>
  Deep AST analysis • Relational call graphs • Local vector retrieval • Multi-turn memory • Grounded line citations
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-%3E%3D20.0.0-339933?logo=node.js&logoColor=white" alt="Node Version" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/SQLite-Structured%20Graph-003B57?logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/LanceDB-Vector%20Store-FF6B6B" alt="LanceDB" />
  <img src="https://img.shields.io/badge/Ollama-100%25%20Offline%20Mode-000000?logo=ollama&logoColor=white" alt="Ollama" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License" />
</p>

---

## Key Highlights & Features

### ⚡ 1. Interactive Terminal REPL with Live In-Place Autocomplete
- **Live `@` Mentions**: Type `@` to open an instant popup suggesting indexed files, directories, and AST symbols (functions, classes, hooks).
- **Targeted Priority Boosting**: Mentioned files and symbols receive top relevance score (`100.0`) in hybrid retrieval.
- **Slash Commands (`/`)**: Real-time autocomplete for commands (`/diagram`, `/tree`, `/status`, `/files`, `/config`, `/reset`, `/clear`).
- **Zero-Flicker ANSI Engine**: In-place line rendering prevents buffer scrolling or conversation history erasure when scrubbing suggestions with <kbd>↑</kbd>/<kbd>↓</kbd> arrows.

### 🧠 2. Multi-Turn Conversational Memory & Intent Fast-Path
- **Continuous Context**: Remembers previous questions and code answers across turns with sliding token-budget compaction.
- **Conversational Fast-Path**: Common greetings and pleasantries (`hey`, `hi`, `thanks`, `who are you`) respond instantly in **$< 1\text{ms}$ with zero token consumption and zero vector lookups**.

### 🔄 3. Real-Time Background File Watcher & Incremental AST Indexing
- **Silent Background Watcher**: `FileWatcher` runs automatically during your chat session.
- **Sub-30ms Incremental Updates**: Saving or deleting a file in VS Code or Cursor automatically triggers an incremental AST re-parse, symbol update, and vector refresh without re-indexing the whole repository.

### 📊 4. Architecture & Sequence Diagram Generator (`/diagram`)
- **Mermaid Architecture Graphs (`graph TD`)**: Visualizes module dependency graphs, imports, and cross-file relationships.
- **Call-Flow Sequence Diagrams (`sequenceDiagram`)**: Traces execution chains across callers and callees with step numbers.
- **Terminal ASCII Mode (`--ascii`)**: Renders clean ASCII dependency trees directly in your terminal.
- **Targeted & Module Fallbacks**: Run `/diagram @src/services/auth.ts` or `/diagram @src/cli/` to inspect specific files or module topologies.

### 🌲 5. Directory & File Tree Visualizer (`/tree`)
- Visual ASCII project structure with line counts:
  - `> /tree` — Full codebase directory hierarchy.
  - `> /tree @src/core/` — Targeted subtree view.
  - `> /tree @schema.ts` — Single-file node with line counts.

### 🌐 6. Universal Multi-Language Support
- **TypeScript & JavaScript** (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`) — Full AST via `ts-morph` (React components, hooks, interfaces, types).
- **Python** (`.py`, `.pyi`) — Classes, methods, async functions, decorators, imports.
- **Go** (`.go`) — Structs, interfaces, receiver methods `(r *Type)`, packages.
- **Rust** (`.rs`) — Structs, enums, traits, `impl` blocks, `pub fn`, `use` statements.
- **Java & Kotlin** (`.java`, `.kt`) — Classes, interfaces, records, methods, annotations.
- **C / C++ / C#** (`.c`, `.cpp`, `.h`, `.hpp`, `.cs`) — Functions, classes, structs, `#include`.
- **PHP & Ruby** (`.php`, `.rb`) — Classes, methods, modules, functions.
- **Data & Config** (`.sql`, `.json`, `.yaml`, `.md`, `.html`, `.css`) — SQL tables, Markdown headers, configs.

### 🔒 7. 100% Offline Local LLMs & Multi-Provider Architecture
- **Offline Local Mode**: Connect seamlessly to local **Ollama** models (`qwen2.5-coder`, `llama3`, `nomic-embed-text`) with zero data leaving your machine.
- **Cloud Embedding Providers**: High-throughput code embeddings via **Voyage AI** (`voyage-code-2`) or **Google Gemini** (`gemini-embedding-001`).
- **Grounded AI Reasoning**: **Gemini 3.1 Flash Lite** for deep contextual code reasoning with exact line-range citations.

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

Codast stores your API keys and model preferences globally in `~/.codebase-ai/config.json`:

```bash
# Configure Gemini API key (for reasoning)
codast config set api-key <YOUR_GEMINI_KEY>

# Configure Voyage AI API key (for code embeddings)
codast config set voyage-key <YOUR_VOYAGE_KEY>

# Switch embedding provider ('voyage', 'gemini', or 'ollama')
codast config set provider voyage

# 100% Offline Local Mode (Ollama)
codast config set provider ollama
codast config set chat-model qwen2.5-coder:latest
codast config set embedding-model nomic-embed-text:latest
```

---

## Usage

### Interactive Chat Session

Navigate to any codebase and launch the REPL:

```bash
codast
# or
cai
```

```text
  ▄▄▄▄      Codast CLI 0.2.0
  ████      Local Code Intelligence & REPL
  ████      Neural AST & Semantic Index Active
  ▀▀▀▀      /Volumes/Mac T7/Projects/cmd-line-ai (main)
  ─────────────────────────────────────────────────────────────────────────────

> explain the authentication flow
> what happens if the session expires? (multi-turn memory)
> explain the error handling in @src/services/auth.ts
> /diagram @src/cli/commands/chat.ts
> /tree @src/core/
```

### In-REPL Slash Commands

| Command | Action |
| :--- | :--- |
| `/diagram [target]` | Generates Mermaid architecture or sequence call-flow diagrams |
| `/tree [target]` | Visualizes ASCII directory tree with file line counts |
| `/status` | Displays repository metrics, indexed files, symbols, chunks, and active models |
| `/files [filter]` | Lists indexed source files with optional filter |
| `/config` | Views active API keys, provider settings, and model configurations |
| `/reset` | Clears conversation memory |
| `/index` | Re-scans and re-indexes the codebase on the fly |
| `/clear` | Clears the terminal screen and resets session |
| `/help` | Displays command cheatsheet |
| `/exit` | Exits the interactive session |

---

### Command Line Interface

```bash
# Initialize local storage (.codebase-ai) in current directory
codast init

# Index the codebase
codast index [--force] [--verbose]

# Watch files in real-time and incrementally re-index on save
codast watch

# Generate visual architecture or sequence call-flow diagrams
codast diagram [target] [--type architecture|sequence] [--ascii]

# View index status and metrics
codast status

# Ask a one-off question from terminal
codast ask "How does user authentication work?"
```

---

## Architecture Overview

```text
Source Files (TS / JS / Python / Go / Rust / Java / C++ / SQL)
      │
      ├──> Polyglot AST Engine ───> SQLite (Symbols & Relational Call Graphs)
      │
      └──> Logical Chunker ───────> Voyage AI / Gemini / Ollama Embeddings
                                                    │
                                                    ▼
                                           LanceDB Vector Store
                                                    │
                                                    ▼
User Query ──> Hybrid Retrieval (Mentions + Symbols + Graph + Vectors)
                                                    │
                                                    ▼
                                         Grounded AI Reasoning
                                                    │
                                                    ▼
                                        Answer + Line Citations
```

---

## Automated Test Suite

All 11 subsystems are fully verified with automated test suites:

```bash
npm test
```

| Test Suite | Coverage Area |
| :--- | :--- |
| `test:scanner` | Repository scanning and ignore filter rules |
| `test:ast` | AST symbol, import, export, and call extraction |
| `test:sqlite` | Structured SQLite storage & relational graph persistence |
| `test:chunker` | AST-aware logical code chunking & headers |
| `test:vector` | LanceDB vector store batch indexing & similarity search |
| `test:retrieval` | Hybrid multi-modal retrieval engine & context ranker |
| `test:multi-lang` | Python, Go, Rust, Java, and polyglot AST parsing |
| `test:history` | Multi-turn conversational memory & token budgeting |
| `test:mentions` | `@` File & Symbol mention resolution & scoring |
| `test:diagram` | Architecture Mermaid, Sequence, and ASCII diagram generator |
| `test:watcher` | Real-time file watcher & incremental AST indexing |

---

## Brand Assets

Vector logo assets are located in [`assets/`](assets/):
- [`assets/codast-logo.svg`](assets/codast-logo.svg) — Transparent 1:1 vector logo with continuous diagonal cascade gradient.
- [`assets/codast-icon.svg`](assets/codast-icon.svg) — Dark terminal squircle app icon.

---

## License

MIT © Pranav
