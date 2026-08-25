import React, { useState, useEffect } from 'react';
import { CornerDownLeft, FolderTree, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';

export const HeroCockpit: React.FC = () => {
  const [activeInstallTab, setActiveInstallTab] = useState<'npm' | 'npx' | 'curl'>('npm');
  const [copied, setCopied] = useState(false);
  const [activeCockpitTab, setActiveCockpitTab] = useState<'repl' | 'graph' | 'watcher'>('repl');

  // REPL State
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: string; type: string; query?: string; tools?: string[]; duration?: string; tokens?: string; content?: React.ReactNode }>>([]);
  const [watcherLogs] = useState<Array<{ time: string; file: string; delta: string; status: string }>>([
    { time: '21:32:04', file: 'src/services/authService.ts', delta: '+12 lines (AST method: login)', status: 'SYNCD (18ms)' },
    { time: '21:32:45', file: 'src/storage/sqlite/db.ts', delta: 'Schema relationship updated', status: 'SYNCD (14ms)' },
    { time: '21:33:10', file: 'src/core/scanner/filters.ts', delta: 'Cache hash updated [a8f1..]', status: 'SYNCD (22ms)' }
  ]);

  const installCommands = {
    npm: 'npm install -g @pra9v/kodast',
    npx: 'npx @pra9v/kodast',
    curl: 'curl -fsSL https://raw.githubusercontent.com/prannav225/kodast/main/install.sh | bash'
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(installCommands[activeInstallTab]);
    setCopied(true);
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.25 }
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const presets = [
    { label: '🔍 @auth.ts', cmd: 'explain @src/services/auth.ts and trace @AuthService.login' },
    { label: '📊 /diagram', cmd: '/diagram @src/core/' },
    { label: '🌲 /tree', cmd: '/tree @src/cli/' },
    { label: '⚡ /config', cmd: '/config' }
  ];

  const handleRunCommand = (cmdText: string) => {
    if (isTyping || !cmdText.trim()) return;
    const trimmed = cmdText.trim();
    setInput('');
    setIsTyping(true);

    const promptId = Date.now().toString();
    setMessages(prev => [...prev, { id: promptId, type: 'prompt', query: trimmed }]);

    setTimeout(() => {
      if (trimmed.startsWith('/diagram')) {
        setMessages(prev => [...prev, {
          id: promptId + '_resp',
          type: 'diagram',
          content: (
            <div className="my-3 p-3.5 sm:p-5 rounded-xl bg-[#000000] border border-white/10 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4 text-[#EDEDED] gap-2">
                <span className="flex items-center gap-2 font-bold text-xs sm:text-sm font-pixel truncate">
                  <span className="text-[#888888]">◈</span> MERMAID ARCHITECTURE
                </span>
                <span className="text-[#888888] text-[10px] font-pixel shrink-0">AST RESOLVED</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-center">
                <div className="p-3 bg-[#0D0D0D] rounded-xl border border-white/10 text-white shadow-md">
                  <div className="text-[10px] text-[#888888] font-pixel mb-1">ENTRYPOINT</div>
                  <div className="font-semibold text-xs sm:text-sm font-mono">chatCommand</div>
                  <div className="text-[10px] text-[#666666] mt-1 font-mono truncate">src/cli/commands/chat.ts</div>
                </div>
                <div className="p-3 bg-[#0D0D0D] rounded-xl border border-white/10 text-white shadow-md">
                  <div className="text-[10px] text-white font-pixel mb-1">HYBRID RETRIEVAL</div>
                  <div className="font-semibold text-xs sm:text-sm font-mono">RetrievalEngine</div>
                  <div className="text-[10px] text-[#666666] mt-1 font-mono truncate">Symbols + Vectors + Graph</div>
                </div>
                <div className="p-3 bg-[#0D0D0D] rounded-xl border border-white/10 text-white shadow-md">
                  <div className="text-[10px] text-white font-pixel mb-1">REASONING</div>
                  <div className="font-semibold text-xs sm:text-sm font-mono">Gemini / Ollama</div>
                  <div className="text-[10px] text-[#666666] mt-1 font-mono truncate">Flash Lite (Grounded)</div>
                </div>
              </div>
            </div>
          )
        }]);
      } else if (trimmed.startsWith('/tree')) {
        setMessages(prev => [...prev, {
          id: promptId + '_resp',
          type: 'tree',
          content: (
            <div className="my-3 p-3.5 sm:p-4 rounded-xl bg-[#000000] border border-white/5 text-xs text-[#888888] leading-relaxed overflow-x-auto">
              <div className="text-white font-bold mb-2 flex items-center gap-2 font-pixel">
                <FolderTree className="w-4 h-4 text-white shrink-0" />
                <span>Codebase Directory Topology:</span>
              </div>
              <div className="space-y-0.5 font-mono min-w-[280px]">
                <div>├── <span className="text-white font-semibold">src/cli/</span> <span className="text-[#666666]">(chat.ts, program.ts)</span></div>
                <div>├── <span className="text-white font-semibold">src/core/</span> <span className="text-[#666666]">(ast-parser.ts, retrieval-engine.ts)</span></div>
                <div>└── <span className="text-white font-semibold">src/storage/</span> <span className="text-[#666666]">(metadata.db, lance-store/)</span></div>
              </div>
            </div>
          )
        }]);
      } else if (trimmed.startsWith('/config')) {
        setMessages(prev => [...prev, {
          id: promptId + '_resp',
          type: 'config',
          content: (
            <div className="my-3 p-3.5 sm:p-4 rounded-xl bg-[#000000] border border-white/5 text-xs">
              <div className="text-white font-bold mb-2 font-pixel">Active Engine Configuration:</div>
              <div className="text-[#888888] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div>• Provider: <span className="text-white font-semibold">gemini</span> / <span className="text-white">ollama</span></div>
                <div>• Reasoning: <span className="text-white font-semibold">gemini-3.1-flash-lite</span></div>
                <div>• Embeddings: <span className="text-white font-semibold">gemini-embedding-001</span></div>
                <div>• Privacy: <span className="text-white">Air-Gapped Ready</span></div>
              </div>
            </div>
          )
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: promptId + '_resp',
          type: 'answer',
          tools: ['src/services/auth.ts:14-64', 'src/types/user.ts:8-22'],
          duration: '0.38s',
          tokens: '3,842',
          content: (
            <div className="space-y-3 text-xs sm:text-sm font-mono text-[#EDEDED] leading-relaxed">
              <p>
                Parsed <span className="text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/15">src/services/auth.ts:14-64</span>. The <code className="text-white font-bold">AuthService.login</code> method executes relational verification against SQLite metadata and signs a JWT bearer token.
              </p>
              <div className="p-3 sm:p-3.5 bg-[#000000] rounded-xl border border-white/5 space-y-1.5 text-xs text-[#888888]">
                <div className="text-white font-semibold font-pixel text-xs">### Key Execution Path</div>
                <div>1. Validates credentials with <code className="text-white">db.users.find()</code> (auth.ts:28).</div>
                <div>2. Issues signed session payload with auto-renewal via interceptor middleware.</div>
              </div>
              <div className="text-[11px] text-[#666666] pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[#888888] truncate">↳ Evidence: src/services/auth.ts:14-64</span>
                <span className="text-white font-semibold font-pixel">Confidence: 99.4%</span>
              </div>
            </div>
          )
        }]);
      }
      setIsTyping(false);
    }, 550);
  };

  useEffect(() => {
    setMessages([
      {
        id: 'init_1',
        type: 'answer',
        content: (
          <div className="text-xs sm:text-sm font-mono text-[#888888]">
            <span className="text-white font-semibold">✔ Ready.</span> Neural AST index active. Type <span className="text-white">@</span> for suggestions, <span className="text-white">/diagram</span> for call flows, or run quick demo pills below.
          </div>
        )
      }
    ]);
  }, []);

  return (
    <section id="cockpit" className="relative bg-[#000000] text-white pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-20 border-b border-white/[0.1]">
      
      {/* Vercel-Style Blueprint Container with Grid & Crosshairs */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Main Blueprint Box */}
        <div className="relative border border-white/[0.15] bg-grid-blueprint p-4 sm:p-8 lg:p-14 mb-12 sm:mb-16 overflow-hidden">
          
          {/* Corner Crosshairs */}
          <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 font-mono text-white text-base sm:text-lg select-none">+</div>
          <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 font-mono text-white text-base sm:text-lg select-none">+</div>
          <div className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 font-mono text-white text-base sm:text-lg select-none">+</div>
          <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 font-mono text-white text-base sm:text-lg select-none">+</div>

          {/* Right Axis Dimension Rulers */}
          <div className="absolute top-8 right-3 flex flex-col gap-8 text-[9px] font-mono text-[#555555] select-none text-right hidden sm:flex">
            <span className="bg-[#111111] px-1 rounded border border-white/5">720</span>
            <span className="bg-[#111111] px-1 rounded border border-white/5">532</span>
            <span className="bg-[#111111] px-1 rounded border border-white/5">0</span>
            <span className="bg-[#111111] px-1 rounded border border-white/5">-212</span>
          </div>

          {/* Floating Pill Tag */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded bg-[#111111] border border-white/20 text-[10px] sm:text-[11px] font-mono text-white mb-4 sm:mb-6 max-w-full truncate">
            <span className="text-[9px] sm:text-[10px] bg-white text-black font-bold px-1.5 py-0.2 rounded shrink-0">New</span>
            <span className="truncate">Kodast v0.3.0 Neural Engine</span>
          </div>

          {/* Giant Geist Pixel Wordmark (Responsive Scaling with Reversed K) */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-pixel tracking-tight text-white mb-3 sm:mb-4 select-none break-words">
            <span className="inline-block scale-x-[-1] origin-center mr-[0.02em]">K</span>odast.
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-[#888888] max-w-2xl font-mono leading-relaxed mb-6 sm:mb-8">
            The neural codebase intelligence engine for your terminal. Polyglot AST graphs, sub-30ms local watcher, and grounded line citations.
          </p>

          {/* 1-Click Install Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 max-w-xl font-mono text-xs w-full">
            <div className="inline-flex items-center bg-[#111111] p-1 rounded-lg border border-white/10 shrink-0 w-fit">
              {(['npm', 'npx', 'curl'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveInstallTab(tab)}
                  className={`px-3 py-1 rounded transition-all text-xs ${
                    activeInstallTab === tab ? 'bg-white text-black font-semibold' : 'text-[#777777] hover:text-white'
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            <div
              onClick={handleCopy}
              className="flex-1 w-full flex items-center justify-between px-3 sm:px-4 py-2.5 rounded-lg bg-[#0A0A0A] border border-white/20 hover:border-white/40 transition-all cursor-pointer text-white min-w-0"
            >
              <div className="flex items-center gap-2 truncate min-w-0">
                <span className="text-[#555555] shrink-0">$</span>
                <span className="truncate text-xs">{installCommands[activeInstallTab]}</span>
              </div>
              <span className="text-[11px] text-[#888888] ml-2 shrink-0">
                {copied ? '✔ Copied' : 'Copy'}
              </span>
            </div>
          </div>

        </div>

        {/* 3-Column Specimen Architecture Grid (Direct Vercel Format) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 border-t border-b border-white/[0.15] divide-y lg:divide-y-0 lg:divide-x divide-white/[0.15] text-left font-mono mb-12 sm:mb-16">
          
          {/* Column 1: AST Extraction */}
          <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6 sm:space-y-12">
            <div>
              <div className="w-8 h-8 rounded border border-white/20 flex items-center justify-center text-xs mb-4 sm:mb-6 text-white">
                01
              </div>
              
              {/* Giant Blueprint Letter with Geometric Circle */}
              <div className="relative py-4 sm:py-8 flex items-center justify-center">
                <div className="text-6xl sm:text-8xl font-pixel text-white select-none">
                  A
                </div>
                <div className="absolute w-12 sm:w-16 h-12 sm:h-16 rounded-full border border-white/40 pointer-events-none" />
              </div>

              <div className="text-xs text-[#888888] uppercase tracking-wider text-center mb-4 sm:mb-6">
                AST Graph Extraction
              </div>
            </div>

            <div className="text-xs text-[#888888] leading-relaxed space-y-2 sm:space-y-3">
              <p>
                At its core, Kodast parses source code into <strong className="text-white">Abstract Syntax Trees</strong> across TypeScript, Go, Rust, and Python without blind vector hallucination.
              </p>
              <p>
                Extracts receiver methods, interfaces, and cross-file dependencies into SQLite relational graphs.
              </p>
            </div>
          </div>

          {/* Column 2: Stats & Key Metrics */}
          <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6 sm:space-y-12">
            <div>
              <div className="w-8 h-8 rounded border border-white/20 flex items-center justify-center text-xs mb-4 sm:mb-6 text-white">
                02
              </div>

              {/* Specimen Metrics Table */}
              <div className="space-y-3 sm:space-y-4 py-2 sm:py-4 text-xs sm:text-sm">
                <div className="flex justify-between pb-2 border-b border-white/10">
                  <span className="text-[#888888]">Languages</span>
                  <span className="text-white font-bold">6 Polyglot ASTs</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-white/10">
                  <span className="text-[#888888]">AST Watcher</span>
                  <span className="text-white font-bold">&lt; 30ms Incremental</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-white/10">
                  <span className="text-[#888888]">Data Egress</span>
                  <span className="text-white font-bold">0 Packets (Ollama)</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-white/10">
                  <span className="text-[#888888]">Citations</span>
                  <span className="text-white font-bold">100% Exact Lines</span>
                </div>
              </div>

              <div className="text-xs text-[#888888] uppercase tracking-wider text-center mt-4 sm:mt-6">
                Neural Performance
              </div>
            </div>

            <div className="text-xs text-[#888888] leading-relaxed">
              <p>
                Engineered with <strong className="text-white">LanceDB vector storage</strong> and SQLite metadata persistence for sub-millisecond local retrieval.
              </p>
            </div>
          </div>

          {/* Column 3: The Statement Quote */}
          <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6 sm:space-y-12">
            <div>
              <div className="w-8 h-8 rounded border border-white/20 flex items-center justify-center text-xs mb-4 sm:mb-6 text-white">
                03
              </div>

              {/* Giant Blueprint Letter with Geometric Circle */}
              <div className="relative py-4 sm:py-8 flex items-center justify-center">
                <div className="text-6xl sm:text-8xl font-pixel text-white select-none">
                  Z
                </div>
                <div className="absolute w-12 sm:w-16 h-12 sm:h-16 rounded-full border border-white/40 pointer-events-none" />
              </div>

              <div className="text-xs text-[#888888] uppercase tracking-wider text-center mb-4 sm:mb-6">
                Grounded REPL Cockpit
              </div>
            </div>

            <div className="text-sm sm:text-base text-white leading-relaxed font-pixel">
              "Kodast truly represents local, private codebase intelligence for the modern developer terminal."
            </div>
          </div>

        </div>

        {/* The Live Interactive Terminal Cockpit */}
        <div className="rounded-2xl bg-[#0A0A0A] border border-white/[0.15] shadow-2xl overflow-hidden text-left font-mono">
          
          {/* Cockpit Header */}
          <div className="bg-[#0D0D0D] border-b border-white/[0.1] px-3 sm:px-6 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white/20" />
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white/20" />
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white/20" />
              <span className="ml-2 sm:ml-3 text-xs text-[#666666] truncate max-w-[160px] sm:max-w-none">
                kodast (REPL) • /workspace
              </span>
            </div>

            <div className="flex items-center gap-1 bg-[#000000] p-1 rounded-lg border border-white/[0.1] text-xs">
              <button
                onClick={() => setActiveCockpitTab('repl')}
                className={`px-2.5 sm:px-3 py-1 rounded transition-all ${
                  activeCockpitTab === 'repl' ? 'bg-white text-black font-semibold' : 'text-[#777777] hover:text-white'
                }`}
              >
                REPL
              </button>
              <button
                onClick={() => setActiveCockpitTab('graph')}
                className={`px-2.5 sm:px-3 py-1 rounded transition-all ${
                  activeCockpitTab === 'graph' ? 'bg-white text-black font-semibold' : 'text-[#777777] hover:text-white'
                }`}
              >
                Graph
              </button>
              <button
                onClick={() => setActiveCockpitTab('watcher')}
                className={`px-2.5 sm:px-3 py-1 rounded transition-all ${
                  activeCockpitTab === 'watcher' ? 'bg-white text-black font-semibold' : 'text-[#777777] hover:text-white'
                }`}
              >
                Watcher
              </button>
            </div>
          </div>

          {/* Pane 1: Interactive REPL */}
          {activeCockpitTab === 'repl' && (
            <div className="p-3.5 sm:p-7 text-xs sm:text-sm min-h-[320px] sm:min-h-[380px] max-h-[460px] overflow-y-auto space-y-4 scanline bg-[#0A0A0A]">
              <div className="p-3 rounded-xl bg-[#0D0D0D] border border-white/[0.08] flex items-center justify-between select-none gap-2">
                <div className="flex items-center gap-2.5 sm:gap-3 truncate">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#161616] border border-white/10 flex items-center justify-center text-xs text-white shrink-0">
                    &gt;_
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-white text-xs sm:text-sm font-pixel truncate">Kodast CLI 0.3.0</div>
                    <div className="text-[10px] sm:text-xs text-[#666666] truncate">Neural AST &amp; Semantic Index Active</div>
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs text-white font-semibold bg-white/10 px-2 sm:px-2.5 py-1 rounded border border-white/20 font-pixel shrink-0">
                  ONLINE
                </span>
              </div>

              {messages.map((m) => (
                <div key={m.id} className="space-y-2">
                  {m.type === 'prompt' && (
                    <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm">
                      <span className="text-[#888888]">&gt;</span>
                      <span className="text-white font-normal break-words">{m.query}</span>
                    </div>
                  )}
                  {m.tools && (
                    <div className="pl-3 sm:pl-4 border-l-2 border-white/10 space-y-1">
                      {m.tools.map((t, idx) => (
                        <div key={idx} className="text-xs text-[#888888] flex items-center gap-2 truncate">
                          <span className="text-white">●</span>
                          <span className="truncate">Read({t})</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {m.content && <div className="pl-3 sm:pl-4">{m.content}</div>}
                </div>
              ))}

              {isTyping && (
                <div className="pl-3 sm:pl-4 text-xs text-[#EDEDED] flex items-center gap-2">
                  <span className="animate-spin text-white">⠋</span>
                  <span className="text-[#888888] truncate">Synthesizing grounded answer with AST context...</span>
                </div>
              )}
            </div>
          )}

          {/* Pane 2: Live Call Graph */}
          {activeCockpitTab === 'graph' && (
            <div className="p-4 sm:p-8 text-xs min-h-[320px] sm:min-h-[380px] flex flex-col justify-between bg-[#0A0A0A]">
              <div>
                <div className="text-white font-bold text-sm sm:text-base mb-1 flex items-center gap-2 font-pixel">
                  <FolderTree className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0" />
                  <span>Relational Dependency Network</span>
                </div>
                <p className="text-xs text-[#666666] mb-6">
                  Bidirectional AST call graph resolved from TypeScript, Go, Rust, and Python files.
                </p>

                <div className="p-4 sm:p-6 rounded-xl bg-[#000000] border border-white/[0.1] flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
                  <div className="p-3 sm:p-4 rounded-xl bg-[#0D0D0D] border border-white/15 text-center w-full md:w-auto md:min-w-[140px]">
                    <div className="text-[10px] text-[#888888] font-pixel tracking-wider">CLIENT ENTRY</div>
                    <div className="font-bold text-xs sm:text-sm text-white mt-1">chatCommand</div>
                    <div className="text-[10px] text-[#666666]">src/cli/commands/chat.ts</div>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-white bg-white/10 px-2 py-0.5 rounded border border-white/20 mb-1 font-pixel">-[IMPORTS]-&gt;</span>
                    <div className="h-4 w-0.5 md:h-0.5 md:w-16 bg-gradient-to-b md:bg-gradient-to-r from-white/20 to-white/60" />
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl bg-[#0D0D0D] border border-white/15 text-center w-full md:w-auto md:min-w-[140px]">
                    <div className="text-[10px] text-white font-pixel tracking-wider">CORE ENGINE</div>
                    <div className="font-bold text-xs sm:text-sm text-white mt-1">RetrievalEngine</div>
                    <div className="text-[10px] text-[#666666]">src/core/retrieval/engine.ts</div>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-white bg-white/10 px-2 py-0.5 rounded border border-white/20 mb-1 font-pixel">-[CALLS]-&gt;</span>
                    <div className="h-4 w-0.5 md:h-0.5 md:w-16 bg-gradient-to-b md:bg-gradient-to-r from-white/60 to-white/20" />
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl bg-[#0D0D0D] border border-white/15 text-center w-full md:w-auto md:min-w-[140px]">
                    <div className="text-[10px] text-[#888888] font-pixel tracking-wider">PERSISTENCE</div>
                    <div className="font-bold text-xs sm:text-sm text-white mt-1">SqliteStore</div>
                    <div className="text-[10px] text-[#666666]">.codebase-ai/metadata.db</div>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-[#888888] pt-4 border-t border-white/5 flex flex-wrap justify-between gap-2 font-pixel">
                <span>Export to Mermaid: <code className="text-white">/diagram</code></span>
                <span className="text-white">11 Subsystems Verified</span>
              </div>
            </div>
          )}

          {/* Pane 3: Watcher Stream */}
          {activeCockpitTab === 'watcher' && (
            <div className="p-4 sm:p-8 text-xs min-h-[320px] sm:min-h-[380px] flex flex-col justify-between bg-[#0A0A0A]">
              <div>
                <div className="text-white font-bold text-sm sm:text-base mb-1 flex items-center gap-2 font-pixel">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse shrink-0" />
                  <span>Daemon FileWatcher (&lt; 30ms Incremental)</span>
                </div>
                <p className="text-xs text-[#666666] mb-6">
                  Watching workspace in background. On file save, triggers AST incremental delta updates.
                </p>

                <div className="space-y-2.5">
                  {watcherLogs.map((log, idx) => (
                    <div key={idx} className="p-2.5 sm:p-3 rounded-lg bg-[#000000] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[#666666] text-[10px] sm:text-xs">[{log.time}]</span>
                        <span className="text-white font-semibold truncate">{log.file}</span>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 text-[11px]">
                        <span className="text-[#888888] truncate">{log.delta}</span>
                        <span className="text-white font-bold font-pixel shrink-0">{log.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-[#666666] font-pixel">
                <span>Event Debounce: 100ms</span>
                <span className="text-white">Zero Full Re-scans</span>
              </div>
            </div>
          )}

          {/* Quick Prompt Pills Bar */}
          <div className="px-3 sm:px-6 py-2.5 bg-[#0D0D0D] border-t border-white/5 flex items-center gap-2 overflow-x-auto select-none no-scrollbar">
            <span className="text-[10px] text-[#666666] uppercase tracking-wider font-pixel shrink-0">Try Demo:</span>
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveCockpitTab('repl');
                  handleRunCommand(p.cmd);
                }}
                disabled={isTyping}
                className="px-2.5 sm:px-3 py-1 rounded-md bg-[#161616] hover:bg-[#222222] text-xs font-pixel text-[#888888] hover:text-white border border-white/5 transition-all whitespace-nowrap active:scale-95 shrink-0"
              >
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          {/* Prompt Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setActiveCockpitTab('repl');
              handleRunCommand(input);
            }}
            className="p-2.5 sm:p-4 bg-[#0D0D0D] border-t border-white/[0.08] flex items-center gap-2 sm:gap-3"
          >
            <span className="text-[#888888] font-bold text-base sm:text-lg pl-1 sm:pl-2">&gt;</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything, type @ for files/symbols, or /diagram..."
              className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-white placeholder:text-[#444444] min-w-0"
            />
            <button
              type="submit"
              disabled={isTyping || !input.trim()}
              className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 transition-all shrink-0"
            >
              <CornerDownLeft className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>
    </section>
  );
};
