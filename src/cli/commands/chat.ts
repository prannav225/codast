import path from "node:path";
import chalk from "chalk";
import ora from "ora";
import { ConfigManager } from "../../config/config-manager.js";
import { SqliteDatabase } from "../../storage/sqlite/db.js";
import { SqliteRepositoryManager } from "../../storage/sqlite/repositories.js";
import { LanceVectorStore } from "../../storage/vector/lance-store.js";
import { createAIService, createEmbeddingProvider } from "../../core/ai/ai-service.js";
import { RetrievalEngine } from "../../core/retrieval/retrieval-engine.js";
import { IndexingPipeline } from "../../core/indexing/pipeline.js";
import { SessionHistory } from "../../core/conversation/session-history.js";
import { DiagramGenerator } from "../../core/analysis/diagram-generator.js";
import { InteractivePrompt, type SuggestionItem } from "../../utils/interactive-prompt.js";
import { FileWatcher } from "../../core/watcher/file-watcher.js";
import { TerminalUI, PIXEL_SPINNER } from "../../utils/ui.js";
import { Logger } from "../../utils/logger.js";

export async function chatCommand(): Promise<void> {
  const cwd = process.cwd();
  const projectRoot = ConfigManager.findProjectRoot(cwd);
  const projectName = path.basename(projectRoot);

  // 1. Auto-initialize if not already initialized
  if (!ConfigManager.isInitialized(projectRoot)) {
    ConfigManager.init(projectRoot);
  }

  const config = ConfigManager.loadConfig(projectRoot);
  const isOllama = config.embeddingProvider === "ollama";
  const geminiKey = ConfigManager.getApiKey(projectRoot);

  if (!isOllama && !geminiKey) {
    Logger.error(
      "Gemini API key is not configured.\nPlease run:\n  kodast config set api-key <YOUR_GEMINI_KEY>\nOr switch to local offline Ollama:\n  kodast config set provider ollama"
    );
    process.exitCode = 1;
    return;
  }

  const dbPath = ConfigManager.getMetadataDbPath(projectRoot);
  const vectorsDir = ConfigManager.getVectorsDirPath(projectRoot);
  const db = SqliteDatabase.get(dbPath);
  const repoManager = new SqliteRepositoryManager(db);
  const repo = repoManager.getOrCreateRepository(projectRoot, projectName);

  // 2. Auto-index if not indexed
  let stats = repoManager.getProjectStats(repo.id);
  if (repo.status !== "INDEXED" || stats.chunkCount === 0) {
    console.log(chalk.hex("#82AAFF")(`\n⚡ Indexing ${chalk.bold(projectName)}...\n`));
    const initSpinner = ora({
      spinner: PIXEL_SPINNER,
      text: chalk.hex("#EEFFFF")("Scanning files, extracting AST symbols, and generating embeddings..."),
      discardStdin: false
    }).start();

    try {
      const pipeline = new IndexingPipeline(projectRoot);
      await pipeline.run({
        onProgress: (stage, detail) => {
          initSpinner.text = chalk.hex("#EEFFFF")(`${stage}${detail ? ` (${detail})` : ""}`);
        }
      });
      initSpinner.succeed(chalk.hex("#C3E88D")("Repository indexed successfully!"));
      stats = repoManager.getProjectStats(repo.id);
    } catch (err: any) {
      initSpinner.warn(chalk.yellow(`Indexing partially completed: ${err.message}`));
      stats = repoManager.getProjectStats(repo.id);
    }
  }

  // 3. Render Antigravity Pixel Header
  TerminalUI.renderBanner(
    projectName,
    {
      files: stats.fileCount,
      symbols: stats.symbolCount,
      chunks: stats.chunkCount
    },
    config,
    projectRoot
  );

  // 4. Initialize AI services, Retrieval Engine, Session History, & Diagram Engine
  const embeddingProvider = createEmbeddingProvider(projectRoot);
  const aiService = createAIService(projectRoot);
  const vectorStore = new LanceVectorStore(vectorsDir);
  await vectorStore.initialize();
  const retrievalEngine = new RetrievalEngine(db, repo.id, vectorStore, embeddingProvider, projectRoot);
  const sessionHistory = new SessionHistory();
  const diagramGenerator = new DiagramGenerator(db, repo.id);

  // 5. Automatic Background File Watcher for Real-Time AST & Vector Sync
  const watcher = new FileWatcher(projectRoot);
  watcher.start();

  // 6. Candidate Builder for Live @-Mention and Slash Command Popup Suggestions
  const getCandidates = (): SuggestionItem[] => {
    const items: SuggestionItem[] = [];

    try {
      const files = repoManager.getAllFiles(repo.id);
      const dirSet = new Set<string>();

      // File & Directory Suggestions
      for (const f of files) {
        items.push({
          name: path.basename(f.path),
          type: "File",
          detail: `${f.path} (${f.line_count} lines)`,
          insertValue: `@${f.path}`
        });

        const dir = path.dirname(f.path);
        if (dir && dir !== "." && !dirSet.has(dir)) {
          dirSet.add(dir);
          items.push({
            name: `${dir}/`,
            type: "Directory",
            detail: `${dir}/`,
            insertValue: `@${dir}/`
          });
        }
      }

      // AST Symbol Suggestions
      const symbols = repoManager.findSymbolsByName(repo.id, "");
      for (const s of symbols.slice(0, 60)) {
        items.push({
          name: s.name,
          type: "Symbol",
          detail: `${s.kind} in ${s.file_path || "source"} (line ${s.start_line})`,
          insertValue: `@${s.name}`
        });
      }
    } catch {}

    // Slash Commands
    const slashCommands: Array<{ cmd: string; desc: string }> = [
      { cmd: "/diagram", desc: "Generate architecture & call-flow diagrams" },
      { cmd: "/tree", desc: "View visual directory file tree" },
      { cmd: "/status", desc: "View indexed files, symbols, chunks & models" },
      { cmd: "/files", desc: "List indexed source files" },
      { cmd: "/index", desc: "Re-scan and index codebase on the fly" },
      { cmd: "/reset", desc: "Clear conversation memory" },
      { cmd: "/config", desc: "View active API keys and model configurations" },
      { cmd: "/clear", desc: "Clear terminal screen and reset history" },
      { cmd: "/help", desc: "Show command reference" },
      { cmd: "/exit", desc: "Exit the chat session" }
    ];

    for (const sc of slashCommands) {
      items.push({
        name: sc.cmd,
        type: "Command",
        detail: sc.desc,
        insertValue: sc.cmd
      });
    }

    return items;
  };

  const interactivePrompt = new InteractivePrompt(projectRoot, getCandidates);

  try {
    while (true) {
      let answer: string;

      try {
        answer = await interactivePrompt.ask(TerminalUI.getPrompt());
      } catch {
        break;
      }

      if (answer === null || answer === undefined) {
        break;
      }

      const query = answer.trim();
      if (!query) continue;

      // Handle Slash Commands
      const lower = query.toLowerCase();

      if (lower === "/exit" || lower === "/quit" || lower === "exit" || lower === "quit") {
        console.log(chalk.hex("#89DDFF")("\n👋 Have a productive day, Sir!\n"));
        break;
      }

      if (lower === "/help" || lower === "?") {
        TerminalUI.renderHelp();
        continue;
      }

      if (lower === "/reset") {
        sessionHistory.clear();
        console.log(chalk.hex("#C3E88D")("\n  ✔ Conversation history reset.\n"));
        continue;
      }

      if (lower === "/clear") {
        sessionHistory.clear();
        const freshStats = repoManager.getProjectStats(repo.id);
        TerminalUI.renderBanner(
          projectName,
          {
            files: freshStats.fileCount,
            symbols: freshStats.symbolCount,
            chunks: freshStats.chunkCount
          },
          config,
          projectRoot
        );
        continue;
      }

      if (lower.startsWith("/diagram") || lower.startsWith("/arch")) {
        const parts = query.split(/\s+/);
        const target = parts.length > 1 ? parts.slice(1).join(" ") : undefined;
        console.log(`\n  ${chalk.hex("#82AAFF").bold("◈ Architecture Diagram")}${target ? ` (${target})` : ""}:`);
        const mermaid = diagramGenerator.generateArchitectureMermaid(target);
        console.log(TerminalUI.formatMarkdown(mermaid));
        console.log();
        continue;
      }

      if (lower.startsWith("/tree")) {
        const parts = query.split(/\s+/);
        const target = parts.length > 1 ? parts.slice(1).join(" ").replace(/^@/, "").trim() : "";
        const allFiles = repoManager.getAllFiles(repo.id);
        const filtered = target
          ? allFiles.filter(f => f.path.toLowerCase().includes(target.toLowerCase()))
          : allFiles;
        TerminalUI.renderFileTree(filtered.map(f => ({ path: f.path, lines: f.line_count })));
        continue;
      }

      if (lower === "/config") {
        const rule = chalk.hex("#3B4261");
        console.log(`\n  ${chalk.hex("#82AAFF").bold("Active Configuration:")}`);
        console.log(`  ${rule("─────────────────────────────────────────")}`);
        console.log(`  ${chalk.hex("#EEFFFF")("Provider:")}       ${chalk.hex("#89DDFF")(config.embeddingProvider)}`);
        console.log(`  ${chalk.hex("#EEFFFF")("Chat Model:")}     ${chalk.hex("#C3E88D")(config.chatModel)}`);
        console.log(`  ${chalk.hex("#EEFFFF")("Embedding Model:")}${chalk.hex("#C3E88D")(config.embeddingModel)}`);
        console.log(`  ${chalk.hex("#EEFFFF")("Gemini API Key:")} ${geminiKey ? chalk.hex("#89DDFF")("Configured (active)") : chalk.hex("#F07178")("Not set")}`);
        console.log(`  ${chalk.hex("#EEFFFF")("Voyage API Key:")} ${ConfigManager.getVoyageApiKey(projectRoot) ? chalk.hex("#89DDFF")("Configured (active)") : chalk.hex("#F07178")("Not set")}`);
        console.log(`  ${rule("─────────────────────────────────────────")}\n`);
        continue;
      }

      if (lower === "/status" || lower === "/stats") {
        const freshStats = repoManager.getProjectStats(repo.id);
        const rule = chalk.hex("#3B4261");
        console.log(`\n  ${chalk.hex("#82AAFF").bold("Kodast Repository Status:")}`);
        console.log(`  ${rule("─────────────────────────────────────────")}`);
        console.log(`  ${chalk.hex("#EEFFFF")("Repository:")}     ${projectName}`);
        console.log(`  ${chalk.hex("#EEFFFF")("Root Path:")}      ${chalk.hex("#676E95")(projectRoot)}`);
        console.log(`  ${chalk.hex("#EEFFFF")("Source Files:")}   ${chalk.hex("#C3E88D")(freshStats.fileCount)}`);
        console.log(`  ${chalk.hex("#EEFFFF")("AST Symbols:")}    ${chalk.hex("#C3E88D")(freshStats.symbolCount)}`);
        console.log(`  ${chalk.hex("#EEFFFF")("Call Edges:")}     ${chalk.hex("#C3E88D")(freshStats.relationshipCount)}`);
        console.log(`  ${chalk.hex("#EEFFFF")("Code Chunks:")}    ${chalk.hex("#C3E88D")(freshStats.chunkCount)}`);
        console.log(`  ${chalk.hex("#EEFFFF")("Engine:")}         ${chalk.hex("#89DDFF")("Active & Ready")}`);
        console.log(`  ${rule("─────────────────────────────────────────")}\n`);
        continue;
      }

      if (lower.startsWith("/files")) {
        const parts = query.split(/\s+/);
        const target = parts.length > 1 ? parts.slice(1).join(" ").replace(/^@/, "").trim() : "";
        const allFiles = repoManager.getAllFiles(repo.id);
        const files = target
          ? allFiles.filter(f => f.path.toLowerCase().includes(target.toLowerCase()))
          : allFiles;
        console.log(chalk.bold.hex("#82AAFF")(`\n  Indexed Files (${files.length}):`));
        for (const f of files.slice(0, 30)) {
          console.log(`    ${chalk.hex("#FFCB6B")("●")} ${chalk.hex("#EEFFFF")(f.path)} ${chalk.hex("#676E95")(`(${f.line_count} lines)`)}`);
        }
        if (files.length > 30) {
          console.log(chalk.hex("#676E95")(`    ... and ${files.length - 30} more files`));
        }
        console.log();
        continue;
      }

      if (lower === "/index" || lower === "/reindex") {
        const indexSpinner = ora({
          spinner: PIXEL_SPINNER,
          text: chalk.hex("#EEFFFF")("Re-indexing codebase..."),
          discardStdin: false
        }).start();

        try {
          const pipeline = new IndexingPipeline(projectRoot);
          await pipeline.run({
            force: true,
            onProgress: (stage, detail) => {
              indexSpinner.text = chalk.hex("#EEFFFF")(`${stage}${detail ? ` (${detail})` : ""}`);
            }
          });
          const freshStats = repoManager.getProjectStats(repo.id);
          indexSpinner.succeed(
            chalk.hex("#C3E88D")(
              `Re-indexed! Files: ${freshStats.fileCount}, Symbols: ${freshStats.symbolCount}, Chunks: ${freshStats.chunkCount}`
            )
          );
        } catch (e: any) {
          indexSpinner.fail(chalk.red(`Re-index failed: ${e.message}`));
        }
        console.log();
        continue;
      }

      // Fast path for Conversational Greetings & Pleasantries (zero token waste)
      const cleanGreeting = query.trim().toLowerCase().replace(/[!?.,]+$/, "");
      const greetingsMap: Record<string, string> = {
        "hi": "Hello! How can I assist you with your codebase today?",
        "hey": "Hello! How can I assist you with your codebase today?",
        "hello": "Hello! How can I assist you with your codebase today?",
        "yo": "Hey there! What can I help you explore or trace in the codebase?",
        "sup": "All systems active. What would you like to inspect?",
        "howdy": "Howdy! How can I help you navigate the codebase?",
        "good morning": "Good morning! How can I help with your code today?",
        "good afternoon": "Good afternoon! How can I help with your code today?",
        "good evening": "Good evening! How can I help with your code today?",
        "thanks": "You're very welcome! Let me know if you need anything else.",
        "thank you": "You're very welcome! Let me know if you need anything else.",
        "thx": "Anytime! Standing by for your next query.",
        "ty": "Anytime! Standing by for your next query.",
        "who are you": "I am Kodast, your local codebase intelligence engine. You can ask me technical questions about your code, trace functions, use @file or @symbol mentions, or run /diagram and /tree.",
        "what can you do": "I can analyze your codebase with AST parsing, trace call flows, resolve @file/@symbol mentions, generate architecture diagrams (/diagram), display project trees (/tree), and answer complex technical questions.",
        "cool": "Standing by for your next query!",
        "nice": "Standing by for your next query!",
        "awesome": "Glad to help! Let me know what you want to explore next.",
        "ok": "Standing by.",
        "okay": "Standing by.",
        "alright": "Standing by."
      };

      if (greetingsMap[cleanGreeting] && !query.includes("@")) {
        const reply = greetingsMap[cleanGreeting];
        sessionHistory.addUserTurn(query);
        sessionHistory.addAssistantTurn(reply);
        console.log(`\n  ${chalk.hex("#EEFFFF")(reply)}\n`);
        continue;
      }

      // Process Question with Multi-Turn Memory & @ Mention Support
      const startTime = Date.now();
      console.log();

      const spinner = ora({
        spinner: PIXEL_SPINNER,
        text: chalk.hex("#EEFFFF")("Thinking & searching codebase..."),
        discardStdin: false
      }).start();

      try {
        sessionHistory.addUserTurn(query);

        // 1. Retrieve Context (including @mentions, symbols, vectors, call graph)
        const context = await retrievalEngine.retrieveContext(query);
        const durationSec = (Date.now() - startTime) / 1000;

        spinner.stop();

        // 2. Render Antigravity Tool Action Lines
        const uniquePaths = Array.from(new Set(context.chunks.map(c => c.filePath)));
        for (const p of uniquePaths.slice(0, 5)) {
          TerminalUI.renderToolAction("Read", `${projectRoot}/${p}`);
        }

        // 3. Render Thought Line
        TerminalUI.renderThoughtHeader(durationSec, context.tokenEstimate);

        if (context.totalChunksCount === 0) {
          console.log(chalk.yellow("  No relevant code context found for this query in the index.\n"));
          continue;
        }

        // 4. Synthesize Grounded Answer with Multi-Turn Conversation Context
        const genSpinner = ora({
          spinner: PIXEL_SPINNER,
          text: chalk.hex("#EEFFFF")("Synthesizing grounded answer..."),
          discardStdin: false
        }).start();

        const historyContext = sessionHistory.getFormattedHistory();
        const fullAssembledContext = historyContext
          ? `${historyContext}\n\n${context.assembledContextText}`
          : context.assembledContextText;

        const result = await aiService.generateAnswer(
          query,
          fullAssembledContext,
          { systemInstruction: undefined }
        );

        genSpinner.stop();

        // Record Assistant Turn
        sessionHistory.addAssistantTurn(result.answer);

        // 5. Render Clean Markdown
        const formatted = TerminalUI.formatMarkdown(result.answer);
        console.log(formatted);
        console.log();

        // 6. Resolve citations
        const resolvedSources =
          result.sources && result.sources.length > 0
            ? result.sources
            : context.chunks.slice(0, 5).map(c => ({
                path: c.filePath,
                startLine: c.startLine,
                endLine: c.endLine
              }));

        // 7. Render Sources & Bottom Status Bar
        TerminalUI.renderSources(resolvedSources, projectRoot);
        TerminalUI.renderBottomBar();
      } catch (err: any) {
        spinner.stop();
        console.log(chalk.red(`\n  ✖ Error: ${err.message}\n`));
      }
    }
  } finally {
    watcher.stop();
  }
}
