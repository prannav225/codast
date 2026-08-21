# Codebase AI CLI — Product Requirements Document (PRD)

**Version:** 1.0  
**Status:** MVP Specification  
**Product Type:** Local-first AI-powered developer CLI

---

## 1. Product Overview

### 1.1 Product Summary

Codebase AI CLI is a terminal-based developer tool that analyzes a local JavaScript/TypeScript codebase, builds a structured understanding of it, and allows developers to ask natural-language questions about the codebase.

The product is **not** a generic chatbot that sends an entire repository to an LLM.

Instead, it follows a local-first code intelligence pipeline:

1. Scan the local repository.
2. Parse source files using AST analysis.
3. Extract symbols, imports, exports, and relationships.
4. Build a local dependency representation.
5. Store structured metadata locally.
6. Generate semantic embeddings for logical code chunks.
7. Retrieve relevant code using structured search, semantic search, and dependency traversal.
8. Send only the relevant context required for a question to Gemini.
9. Return an answer with exact file and line citations.

### 1.2 Core Value Proposition

> Understand a codebase through your terminal without uploading the entire repository to a third-party application.

The repository is analyzed and indexed locally. Structured metadata and vectors remain on the developer's machine. Gemini is used only when AI reasoning or embeddings are required, and the tool should minimize the amount of source code sent externally.

### 1.3 Primary Users

- Developers joining an unfamiliar codebase
- Developers working with large personal projects
- Developers who want to trace application flows
- Developers investigating dependencies before making changes
- Developers who want a local-first alternative to web-based codebase chat tools

---

# 2. Problem Statement

Understanding an existing codebase is time-consuming.

Developers frequently need answers to questions such as:

- Where is authentication handled?
- What happens when a user logs in?
- Which files use this service?
- What could break if I change this type?
- Where is this API endpoint called?
- How is this feature implemented?
- Which parts of the application are connected?

Traditional search tools find text matches but do not understand relationships.

A generic LLM chat solution has additional problems:

- The entire codebase may be too large for context windows.
- Sending an entire repository is inefficient and expensive.
- Plain text chunking loses structural information.
- Vector search alone may miss exact symbols and dependency relationships.
- Answers may not provide trustworthy file-level evidence.

Codebase AI CLI solves this by combining AST-based structural analysis with semantic retrieval and LLM reasoning.

---

# 3. Product Goals

## 3.1 MVP Goals

The MVP must:

1. Run as a CLI inside a local JavaScript/TypeScript repository.
2. Scan and filter repository files.
3. Parse JavaScript, TypeScript, JSX, and TSX source files.
4. Extract basic code structure:
   - imports
   - exports
   - functions
   - classes
   - interfaces
   - types
   - React components where detectable
5. Store structured metadata locally.
6. Build basic import/dependency relationships.
7. Create logical code chunks.
8. Generate and store embeddings locally.
9. Allow natural-language questions about the indexed repository.
10. Retrieve context using more than vector search alone.
11. Use Gemini for reasoning and answer generation.
12. Cite exact files and line ranges in answers.
13. Keep repository indexing and storage local.

## 3.2 Secondary Goals

- Interactive terminal experience
- Clear indexing progress
- Useful error messages
- Re-indexing support
- Incremental indexing in later versions
- Git-aware analysis in later versions

---

# 4. Non-Goals for MVP

The following must NOT be treated as required for the first version:

- Web dashboard
- User authentication
- Cloud accounts
- GitHub OAuth
- Uploading repositories to our servers
- PostgreSQL
- Redis
- Docker
- Background workers
- Multi-user support
- Graph database
- Automatic code modification
- Autonomous agent that edits repositories
- Multi-language support beyond JS/TS/JSX/TSX
- Full IDE integration
- Git history intelligence
- Dead-code detection with guaranteed accuracy

The MVP should remain a focused local CLI.

---

# 5. Core User Experience

## 5.1 Installation

The intended final experience should support:

```bash
npx codebase-ai
```

or after installation:

```bash
npm install -g codebase-ai
```

The exact package name can change during implementation.

## 5.2 Initialize

From inside a repository:

```bash
cd my-project
codebase-ai init
```

Expected behavior:

- Detect the project root.
- Verify that the directory appears to be a supported project.
- Create a local `.codebase-ai` directory.
- Create local configuration and storage.
- Do not modify application source files.

Example:

```text
my-project/
├── src/
├── package.json
├── tsconfig.json
└── .codebase-ai/
    ├── config.json
    ├── metadata.db
    └── vectors/
```

## 5.3 Index

```bash
codebase-ai index
```

Expected pipeline:

```text
Discover Repository
        ↓
Filter Files
        ↓
Parse Source Files
        ↓
Extract Symbols
        ↓
Extract Imports / Exports
        ↓
Resolve Relationships
        ↓
Create Logical Chunks
        ↓
Generate Embeddings
        ↓
Store Metadata + Vectors
        ↓
Mark Repository Indexed
```

Example terminal output:

```text
Codebase AI

Repository detected: buckflo

✓ Found 247 source files
✓ Parsed 1,842 symbols
✓ Found 326 import relationships
✓ Created 1,420 code chunks
✓ Generated embeddings
✓ Codebase indexed successfully

Ready for questions.
```

The actual numbers should be derived from real indexing results.

## 5.4 Ask

```bash
codebase-ai ask "Where is authentication handled?"
```

The tool must:

1. Validate that the repository has been indexed.
2. Analyze the question.
3. Search exact symbols and metadata.
4. Perform semantic/vector search.
5. Traverse relevant relationships when useful.
6. Rank and deduplicate context.
7. Send only the selected context to Gemini.
8. Generate an answer.
9. Include citations.

Example:

```text
Authentication is primarily handled through:

1. src/hooks/useAuth.ts
   Manages authentication state and exposes login/logout behavior.

2. src/services/authService.ts
   Handles authentication requests and token operations.

3. src/api/client.ts
   Attaches authentication credentials to API requests.

Flow:

LoginPage.tsx
  → useAuth.ts
  → authService.ts
  → API client

Sources:
  src/hooks/useAuth.ts:14-87
  src/services/authService.ts:22-104
  src/api/client.ts:8-31
```

All statements should be grounded in retrieved code.

---

# 6. Product Commands

## Required MVP Commands

### `init`

```bash
codebase-ai init
```

Creates local product storage and configuration.

### `index`

```bash
codebase-ai index
```

Scans and indexes the repository.

Possible future options:

```bash
codebase-ai index --force
codebase-ai index --verbose
```

### `ask`

```bash
codebase-ai ask "Explain the authentication flow"
```

Answers questions using the local index and Gemini.

Optional future behavior:

```bash
codebase-ai ask "..." --verbose
```

Verbose mode may display retrieved files/chunks and context statistics.

### `status`

```bash
codebase-ai status
```

Displays:

- repository name/path
- indexed status
- indexed file count
- symbol count
- relationship count
- chunk count
- last indexed time

### `config`

The tool should provide a way to configure the Gemini API key and model settings. Exact command UX can be decided during implementation.

Examples:

```bash
codebase-ai config set api-key
codebase-ai config show
```

Sensitive API keys must not be committed into repository configuration files.

---

# 7. Technical Architecture

## 7.1 High-Level Architecture

```text
┌───────────────────────────────────────┐
│              CLI Interface            │
│     init / index / ask / status       │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│             Core Services             │
│                                       │
│ Repository Scanner                    │
│ AST Analyzer                          │
│ Symbol Extractor                      │
│ Relationship Resolver                 │
│ Chunking Engine                       │
│ Retrieval Engine                      │
│ AI Service                            │
└───────────────┬───────────┬───────────┘
                │           │
                ▼           ▼
        ┌────────────┐ ┌──────────────┐
        │   SQLite   │ │   LanceDB    │
        │ Metadata + │ │   Vectors    │
        │ Relations  │ │              │
        └────────────┘ └──────────────┘
                │
                ▼
          Local Repository
                │
                ▼
           Gemini API
       Reasoning / Embeddings
```

## 7.2 Data Locality

The following must remain local:

- repository source files
- parsed AST metadata
- symbol metadata
- dependency relationships
- local database
- vector database/index
- product configuration except externally required credentials

Code should only be sent to Gemini when required for:

- embedding logical chunks
- answering a user question

For question answering, only selected relevant chunks should be sent.

The product must never silently send the full repository as a single prompt.

---

# 8. Recommended Technology Stack

## Runtime and Language

- Node.js
- TypeScript

## CLI

- Commander.js

## Terminal Experience

Use a simple implementation initially. Recommended libraries:

- Ink for richer interactive terminal UI where useful
- ora for progress indicators
- chalk for terminal formatting

Ink is optional for simple one-shot commands but is recommended for future interactive chat mode.

## Code Analysis

- ts-morph
- TypeScript Compiler API

The MVP supports:

- `.ts`
- `.tsx`
- `.js`
- `.jsx`

## Structured Storage

- SQLite
- better-sqlite3

Drizzle ORM is optional. Do not introduce it unless it meaningfully improves maintainability.

## Vector Search

- LanceDB

LanceDB must run locally without requiring a separate hosted service.

## AI

- Gemini API
- `@google/genai`

Use Gemini for:

- query understanding where needed
- answer generation
- semantic embeddings

The implementation should keep the AI provider behind an abstraction where practical, so a future provider can be added without rewriting retrieval or indexing logic.

## Validation

- Zod

Use for:

- application configuration
- internal schemas
- AI structured responses where applicable

## Git

Not required for MVP. Future version:

- simple-git

---

# 9. Repository Scanning

## 9.1 File Discovery

The scanner must recursively discover supported source files from the repository root.

It must respect:

- `.gitignore` where practical
- explicit product exclusions
- common generated/dependency directories

Default exclusions include:

```text
node_modules/
.git/
dist/
build/
coverage/
.next/
out/
.cache/
.codebase-ai/
```

The scanner should also avoid indexing obvious secrets:

```text
.env
.env.*
```

The implementation must not read or send environment secrets as code context.

## 9.2 Supported Files

MVP:

```text
.ts
.tsx
.js
.jsx
```

Potential future support:

```text
.py
.go
.java
.rs
```

Do not add Tree-sitter to MVP unless necessary. ts-morph is the preferred initial parser because the MVP is focused on JavaScript and TypeScript ecosystems.

---

# 10. AST Analysis

The AST analyzer must not treat source code only as arbitrary text.

For each supported file, extract as much reliable information as practical.

## 10.1 Required Metadata

### File

```text
path
extension
content hash
line count
```

### Imports

Capture:

```text
source module
imported symbols
local aliases where applicable
```

### Exports

Capture:

```text
symbol name
export type
default/named
```

### Symbols

At minimum:

```text
functions
classes
interfaces
types
variables where useful
methods where useful
```

### React Awareness

Where reasonably detectable, identify:

```text
React components
custom hooks
```

Detection does not need to be perfect. Do not present heuristics as guaranteed facts.

---

# 11. Relationship Analysis

The system must build a basic relationship model.

Initial relationship types may include:

```text
IMPORTS
EXPORTS
DEFINES
REFERENCES
USES
CALLS
```

The MVP should prioritize relationships that can be established reliably.

Example:

```text
LoginPage
    │
    └── USES → useAuth
                    │
                    └── CALLS → authService
```

Relationship analysis should be designed as a separate service so it can improve independently.

Do not require a graph database.

Relationships should initially be stored in SQLite.

---

# 12. Logical Code Chunking

The chunking system must prefer logical code boundaries over arbitrary fixed-size splitting.

Preferred chunk candidates:

- function
- class
- method
- React component
- custom hook
- interface/type definition when relevant
- module-level code where no better boundary exists

Each chunk should store:

```text
id
repository id
file path
symbol id if applicable
chunk type
name
start line
end line
content
content hash
```

Avoid blindly splitting every N tokens unless a very large logical unit requires secondary splitting.

When secondary splitting is necessary, preserve:

- file path
- parent symbol
- line range
- overlap/context where useful

---

# 13. Local Data Model

The exact SQL schema is an implementation decision, but the conceptual model should include:

## Repositories

```text
id
root_path
name
created_at
last_indexed_at
status
```

## Files

```text
id
repository_id
path
extension
content_hash
line_count
```

## Symbols

```text
id
file_id
name
kind
start_line
end_line
```

## Relationships

```text
id
repository_id
source_symbol_id
target_symbol_id
relationship_type
```

File-level relationships may be used when symbol-level resolution is unavailable.

## Chunks

```text
id
file_id
symbol_id nullable
name
chunk_type
start_line
end_line
content_hash
```

## Index Metadata

Track indexing state and hashes so future incremental indexing can be added.

---

# 14. Embeddings and Vector Search

## 14.1 Embedding Generation

Embeddings should be generated for logical code chunks.

Before embedding, the implementation may enrich chunk text with metadata such as:

```text
File: src/services/authService.ts
Symbol: login
Type: function
```

The exact embedding representation should be tested rather than assumed.

## 14.2 Local Vector Storage

Vectors must be stored locally using LanceDB.

Suggested metadata:

```text
chunk_id
file_path
symbol_name
chunk_type
start_line
end_line
embedding
```

## 14.3 Re-indexing

The system should avoid regenerating embeddings for unchanged content when practical.

Use content hashes to support future incremental indexing.

---

# 15. Retrieval Architecture

This is a critical product requirement.

The answer pipeline must NOT depend solely on vector similarity search.

The retrieval engine should combine:

### 1. Exact / Symbol Search

Useful for questions mentioning:

- function names
- class names
- file names
- types
- known identifiers

### 2. Semantic Search

Useful for natural-language concepts.

Example:

> Where is authentication handled?

may retrieve code that does not literally contain the phrase "authentication".

### 3. Dependency Traversal

Useful for flow questions.

Example:

> What happens when a user logs in?

Potential retrieval:

```text
LoginPage
→ useAuth
→ authService
→ API client
```

### 4. File/Metadata Search

Useful when questions refer to known paths or module names.

## 15.1 Retrieval Pipeline

```text
User Question
       ↓
Query Classification / Understanding
       ↓
┌────────────────────────────────────┐
│ Parallel / Combined Retrieval      │
│                                    │
│ Exact Symbol Search                │
│ Semantic Vector Search             │
│ File Metadata Search               │
│ Dependency Traversal               │
└────────────────┬───────────────────┘
                 ↓
          Rank Relevant Results
                 ↓
          Deduplicate Results
                 ↓
          Apply Context Budget
                 ↓
          Gemini
                 ↓
        Grounded Answer + Citations
```

The retrieval implementation should be modular and testable.

---

# 16. AI Answer Generation

Gemini receives:

- the user's question
- selected code context
- file paths
- line ranges
- optional relationship context

The answer-generation prompt must instruct the model:

1. Answer using the provided context.
2. Do not invent files, symbols, or relationships.
3. Clearly state uncertainty when evidence is insufficient.
4. Prefer concise technical explanations.
5. Cite supporting file paths and line ranges.
6. Distinguish confirmed relationships from inferred possibilities.

The application should ideally request structured output internally.

Conceptual response:

```json
{
  "answer": "Authentication is primarily handled through...",
  "sources": [
    {
      "path": "src/hooks/useAuth.ts",
      "startLine": 14,
      "endLine": 87
    }
  ],
  "confidence": "high"
}
```

The final terminal renderer can convert this into a readable response.

---

# 17. Citation Requirements

Every AI answer that makes claims about the repository should provide source citations where possible.

Format:

```text
Sources:
  src/hooks/useAuth.ts:14-87
  src/services/authService.ts:22-104
```

For more advanced output, citations may be attached to individual sections.

The user should be able to trust and verify the answer by opening the referenced source.

Future enhancement:

```bash
codebase-ai open src/services/authService.ts:42
```

This is not required for MVP.

---

# 18. Privacy Requirements

Privacy is a core product principle.

## Must

- Analyze repository structure locally.
- Store metadata locally.
- Store vectors locally.
- Exclude `.env` and similar secret files by default.
- Minimize source code sent to external AI APIs.
- Make it clear when external AI processing is being used.

## Must Not

- Upload the entire repository to a proprietary backend.
- Send all files to Gemini for every question.
- Read or expose environment variables as code context.
- silently transmit source code without the AI feature requiring it.

A future `--verbose` mode should show:

```text
Retrieved 8 code chunks
Estimated context: 12,400 characters
Sending selected context to Gemini
```

Exact metrics are implementation-dependent.

---

# 19. Error Handling

The CLI must provide useful errors for:

### No supported project detected

```text
No supported JavaScript/TypeScript project was detected.
Run this command from a project directory.
```

### Not initialized

```text
Codebase AI has not been initialized.
Run: codebase-ai init
```

### Not indexed

```text
No codebase index found.
Run: codebase-ai index
```

### Missing Gemini configuration

```text
Gemini API credentials are not configured.
Run the configuration command to add your API key.
```

### Indexing failure

The tool should report:

- which stage failed
- which file caused a parser failure where applicable
- whether indexing can continue by skipping the file

A single malformed source file should not necessarily destroy the entire index.

---

# 20. Performance Requirements

For MVP:

- Avoid loading all source files into memory simultaneously where unnecessary.
- Skip excluded directories early.
- Deduplicate chunks.
- Cache metadata where practical.
- Use content hashes to enable future incremental indexing.
- Show progress for long-running indexing.
- Avoid calling Gemini for purely local operations.

Exact performance targets should be established after testing on real repositories.

Correctness and understandable architecture are more important than premature optimization.

---

# 21. Project Structure Recommendation

The implementation should separate responsibilities clearly.

Suggested structure:

```text
src/
├── cli/
│   ├── commands/
│   │   ├── init.ts
│   │   ├── index.ts
│   │   ├── ask.ts
│   │   ├── status.ts
│   │   └── config.ts
│   └── program.ts
│
├── core/
│   ├── repository/
│   │   ├── scanner.ts
│   │   └── filters.ts
│   │
│   ├── analysis/
│   │   ├── parser.ts
│   │   ├── symbols.ts
│   │   ├── imports.ts
│   │   ├── relationships.ts
│   │   └── chunker.ts
│   │
│   ├── indexing/
│   │   ├── indexer.ts
│   │   └── pipeline.ts
│   │
│   ├── retrieval/
│   │   ├── symbol-search.ts
│   │   ├── vector-search.ts
│   │   ├── relationship-search.ts
│   │   ├── ranker.ts
│   │   └── retrieval-engine.ts
│   │
│   └── ai/
│       ├── provider.ts
│       ├── gemini.ts
│       ├── embeddings.ts
│       └── answer.ts
│
├── storage/
│   ├── sqlite/
│   └── vector/
│
├── config/
│
├── types/
│
└── utils/
```

This structure is a recommendation, not a requirement. Antigravity should preserve separation of concerns rather than blindly following filenames.

---

# 22. Implementation Phases

## Phase 1 — CLI Foundation

Build:

- TypeScript project
- Commander CLI
- `init`
- `status`
- project root detection
- `.codebase-ai` directory
- configuration foundation

Acceptance criteria:

```bash
codebase-ai init
codebase-ai status
```

work reliably in a supported project.

## Phase 2 — Repository Scanner

Build:

- recursive file discovery
- exclusions
- supported extension filtering
- `.gitignore` awareness where practical

Acceptance criteria:

The scanner returns only relevant source files and excludes dependencies/generated files.

## Phase 3 — AST Intelligence

Build with ts-morph:

- source parsing
- imports
- exports
- functions
- classes
- interfaces
- types
- basic React component/hook detection

Acceptance criteria:

Parsed metadata can be printed or inspected for a real TypeScript/React project.

## Phase 4 — Local Structured Index

Build:

- SQLite schema
- repositories
- files
- symbols
- relationships
- chunks
- content hashes

Acceptance criteria:

`index` persists repository intelligence locally.

## Phase 5 — Logical Chunking

Build:

- symbol-based chunks
- line ranges
- content storage/retrieval
- fallback handling for module-level code

Acceptance criteria:

Chunks correspond primarily to meaningful code boundaries rather than arbitrary character counts.

## Phase 6 — Gemini Embeddings + LanceDB

Build:

- embedding generation
- local LanceDB storage
- semantic similarity search

Acceptance criteria:

Natural-language queries can retrieve relevant chunks.

## Phase 7 — Ask Command

Build:

- exact symbol search
- semantic search
- result ranking
- context assembly
- Gemini answer generation
- file/line citations

Acceptance criteria:

```bash
codebase-ai ask "Where is authentication handled?"
```

returns a grounded answer with sources.

## Phase 8 — Relationship-Aware Retrieval

Build:

- import graph traversal
- symbol relationship traversal where reliable
- flow-oriented context expansion

Acceptance criteria:

Questions such as:

```bash
codebase-ai ask "What happens when a user logs in?"
```

can retrieve connected code rather than unrelated similar chunks.

---

# 23. Future Roadmap

## V1.x

### Interactive Chat

```bash
codebase-ai chat
```

Example:

```text
Codebase AI
Repository: buckflo

You › Where is authentication handled?

AI › ...

You › What happens after login?

AI › ...
```

Conversation context should not replace repository retrieval.

### Trace

```bash
codebase-ai trace "user login"
```

Goal: visualize a detected flow.

### Impact

```bash
codebase-ai impact User
```

Goal: identify likely references and affected code.

These features should communicate confidence and avoid claiming guaranteed impact detection.

## V2

### Git Intelligence

Use `simple-git`.

Potential commands:

```bash
codebase-ai history auth
codebase-ai changes --since "2 weeks ago"
```

Possible questions:

> Why was this code changed?

> What changed in authentication recently?

### Multi-Language Support

Introduce Tree-sitter only when expanding beyond the TypeScript ecosystem.

Potential support:

- Python
- Go
- Java
- Rust

### IDE Integration

Potential VS Code extension using the same core indexing and retrieval engine.

The CLI core should remain reusable enough to support this later.

---

# 24. Quality Requirements

## Code Quality

- TypeScript strict mode
- clear interfaces between modules
- avoid `any` unless justified
- Zod validation at system boundaries
- small, testable services
- no giant god classes
- no direct Gemini calls scattered throughout the application

## Testing

Prioritize tests for:

- file filtering
- AST extraction
- chunk boundaries
- relationship extraction
- symbol search
- ranking
- context assembly

Mock AI API calls in automated tests.

## Observability

For development, support useful logs without leaking source code unnecessarily.

Example:

```text
[scanner] 247 files discovered
[parser] 243 files parsed successfully
[parser] 4 files skipped
[indexer] 1842 symbols stored
[embeddings] 1420 chunks processed
```

Verbose output should be opt-in where practical.

---

# 25. Key Architectural Rules for Implementation

These rules are important.

1. **Do not build a web application.**
   This product is a CLI.

2. **Do not introduce unnecessary infrastructure.**
   No Postgres, Redis, Docker, queues, or hosted backend for MVP.

3. **Do not send the entire repository to Gemini.**

4. **Do not build this as vector-search-only RAG.**
   Combine structured search, semantic search, and relationships.

5. **Do not chunk code purely by arbitrary token count when AST boundaries are available.**

6. **Do not add multi-language parsing before JavaScript/TypeScript support is solid.**

7. **Keep all indexing and storage local.**

8. **Keep AI provider integration isolated behind a service/abstraction.**

9. **Every repository-specific answer should be grounded in retrieved code and include citations where possible.**

10. **Build incrementally and verify each phase before moving to the next.**

11. **Prefer a working, testable MVP over speculative advanced features.**

12. **Do not fabricate architecture or relationships when the parser/retrieval engine cannot establish them. Clearly communicate uncertainty.**

---

# 26. MVP Definition of Done

The MVP is complete when a developer can:

1. Install or run the CLI.
2. Navigate into a local React/Node/TypeScript repository.
3. Run:

```bash
codebase-ai init
```

4. Configure Gemini credentials securely.
5. Run:

```bash
codebase-ai index
```

6. Have the tool:

- discover supported files
- exclude irrelevant/generated/secret files
- parse the code using AST analysis
- extract symbols and imports/exports
- store metadata locally in SQLite
- create logical code chunks
- generate embeddings
- store vectors locally in LanceDB

7. Run:

```bash
codebase-ai ask "Where is authentication handled?"
```

8. Receive a useful answer based on retrieved repository context, including exact source file and line citations.

9. Run another question such as:

```bash
codebase-ai ask "What happens when a user logs in?"
```

and have the system use both semantic retrieval and known code relationships to assemble relevant context.

---

# 27. Final Product Positioning

Codebase AI CLI is a **local-first AI code intelligence tool for understanding existing JavaScript and TypeScript repositories from the terminal**.

Its differentiators are:

- Local repository analysis
- AST-aware code understanding
- Structured symbol metadata
- Dependency-aware retrieval
- Local vector storage
- Minimal code sent to the LLM
- Gemini-powered reasoning
- Verifiable file and line citations

The product should feel like a developer tool first and an AI application second.

The LLM is one component of the system. The core value comes from combining code structure, semantic retrieval, and relationship-aware context to give the LLM the right evidence.
