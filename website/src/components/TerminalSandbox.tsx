import React, { useState, useEffect, useRef } from 'react';
import { Terminal, CornerDownLeft } from 'lucide-react';

interface TerminalMessage {
  id: string;
  type: 'prompt' | 'tools' | 'thought' | 'answer' | 'diagram' | 'tree' | 'config' | 'error';
  query?: string;
  tools?: string[];
  duration?: string;
  tokens?: string;
  content?: React.ReactNode;
  sources?: string[];
}

export const TerminalSandbox: React.FC = () => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion] = useState(0);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    { name: 'src/services/auth.ts', type: 'File', detail: 'JWT authentication and session handling (64L)' },
    { name: 'src/core/scanner/scanner.ts', type: 'File', detail: 'High-throughput repository scanner (118L)' },
    { name: 'AuthService.login', type: 'Symbol', detail: 'Async method in authService.ts' },
    { name: 'RepositoryScanner', type: 'Symbol', detail: 'Class in scanner.ts' },
    { name: '/diagram', type: 'Command', detail: 'Generate Mermaid architecture graph' },
    { name: '/tree', type: 'Command', detail: 'Render ASCII codebase file tree' },
  ];

  const presets = [
    { label: '🔍 Explain Auth Flow', cmd: 'explain @src/services/auth.ts and trace @AuthService.login' },
    { label: '📊 Generate Architecture', cmd: '/diagram @src/core/' },
    { label: '🌲 Visualize Tree', cmd: '/tree @src/cli/' },
    { label: '⚡ Active Config', cmd: '/config' },
  ];

  const handleRunCommand = (cmdText: string) => {
    if (isTyping || !cmdText.trim()) return;

    const trimmed = cmdText.trim();
    setInput('');
    setShowSuggestions(false);
    setIsTyping(true);

    const promptId = Date.now().toString();

    // 1. Add Prompt Message
    setMessages(prev => [...prev, {
      id: promptId,
      type: 'prompt',
      query: trimmed
    }]);

    setTimeout(() => {
      // 2. Handle Slash Commands & Queries
      if (trimmed.startsWith('/diagram')) {
        setMessages(prev => [...prev, {
          id: promptId + '_resp',
          type: 'diagram',
          content: (
            <div className="my-3 p-4 rounded-xl bg-[#090A0F]/90 border border-[#2E344A] font-mono text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#1F2335] mb-3 text-[#82AAFF]">
                <span className="flex items-center gap-2 font-bold">
                  <span className="text-[#FFCB6B]">◈</span> Mermaid Architecture Dependency Graph
                </span>
                <span className="text-[#676E95]">graph TD</span>
              </div>
              
              {/* Interactive SVG Diagram Visualizer */}
              <div className="p-4 bg-[#0D1117] rounded-lg border border-[#1F2335]/80 flex flex-col md:flex-row items-center justify-between gap-4 overflow-x-auto">
                <div className="p-3 rounded-lg bg-[#161922] border border-[#82AAFF]/40 text-[#EEFFFF] text-center min-w-[140px] shadow-lg shadow-[#82AAFF]/10">
                  <div className="text-[10px] text-[#82AAFF] font-bold">SOURCE ENTRY</div>
                  <div className="font-semibold mt-1">chat.ts</div>
                  <div className="text-[10px] text-[#676E95]">370 lines</div>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-[#C3E88D] bg-[#C3E88D]/10 px-2 py-0.5 rounded border border-[#C3E88D]/30 mb-1">imports</span>
                  <div className="h-0.5 w-16 md:w-20 bg-gradient-to-r from-[#82AAFF] to-[#89DDFF]" />
                </div>

                <div className="p-3 rounded-lg bg-[#161922] border border-[#89DDFF]/40 text-[#EEFFFF] text-center min-w-[140px] shadow-lg shadow-[#89DDFF]/10">
                  <div className="text-[10px] text-[#89DDFF] font-bold">RETRIEVAL</div>
                  <div className="font-semibold mt-1">RetrievalEngine</div>
                  <div className="text-[10px] text-[#676E95]">Hybrid Ranking</div>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-[#C792EA] bg-[#C792EA]/10 px-2 py-0.5 rounded border border-[#C792EA]/30 mb-1">calls</span>
                  <div className="h-0.5 w-16 md:w-20 bg-gradient-to-r from-[#89DDFF] to-[#C792EA]" />
                </div>

                <div className="p-3 rounded-lg bg-[#161922] border border-[#C792EA]/40 text-[#EEFFFF] text-center min-w-[140px] shadow-lg shadow-[#C792EA]/10">
                  <div className="text-[10px] text-[#C792EA] font-bold">NEURAL REASONING</div>
                  <div className="font-semibold mt-1">Gemini 3.1</div>
                  <div className="text-[10px] text-[#676E95]">Flash Lite</div>
                </div>
              </div>
            </div>
          )
        }]);
        setIsTyping(false);
      } else if (trimmed.startsWith('/tree')) {
        setMessages(prev => [...prev, {
          id: promptId + '_resp',
          type: 'tree',
          content: (
            <div className="my-2 p-3.5 rounded-lg bg-[#0D1117] border border-[#1F2335] font-mono text-xs text-[#EEFFFF] leading-relaxed">
              <div className="text-[#82AAFF] font-bold mb-2">◈ Codebase File Tree <span className="text-[#676E95] font-normal">(18 indexed files)</span>:</div>
              <div className="text-[#676E95]">├── <span className="text-[#82AAFF] font-semibold">src/</span></div>
              <div className="text-[#676E95]">│   ├── <span className="text-[#82AAFF] font-semibold">cli/</span></div>
              <div className="text-[#676E95]">│   │   ├── <span className="text-[#EEFFFF]">chat.ts</span> <span className="text-[#4F5676]">(370 lines)</span></div>
              <div className="text-[#676E95]">│   │   └── <span className="text-[#EEFFFF]">program.ts</span> <span className="text-[#4F5676]">(82 lines)</span></div>
              <div className="text-[#676E95]">│   ├── <span className="text-[#82AAFF] font-semibold">core/</span></div>
              <div className="text-[#676E95]">│   │   ├── <span className="text-[#EEFFFF]">ast-parser.ts</span> <span className="text-[#4F5676]">(215 lines)</span></div>
              <div className="text-[#676E95]">│   │   ├── <span className="text-[#EEFFFF]">retrieval-engine.ts</span> <span className="text-[#4F5676]">(180 lines)</span></div>
              <div className="text-[#676E95]">│   │   └── <span className="text-[#EEFFFF]">file-watcher.ts</span> <span className="text-[#4F5676]">(113 lines)</span></div>
              <div className="text-[#676E95]">│   └── <span className="text-[#82AAFF] font-semibold">storage/</span></div>
              <div className="text-[#676E95]">│       ├── <span className="text-[#EEFFFF]">db.ts</span> <span className="text-[#4F5676]">(48 lines)</span></div>
              <div className="text-[#676E95]">│       └── <span className="text-[#EEFFFF]">lance-store.ts</span> <span className="text-[#4F5676]">(145 lines)</span></div>
              <div className="text-[#676E95]">└── <span className="text-[#EEFFFF]">package.json</span> <span className="text-[#4F5676]">(82 lines)</span></div>
            </div>
          )
        }]);
        setIsTyping(false);
      } else if (trimmed.startsWith('/config')) {
        setMessages(prev => [...prev, {
          id: promptId + '_resp',
          type: 'config',
          content: (
            <div className="my-2 p-3.5 rounded-lg bg-[#0D1117] border border-[#1F2335] font-mono text-xs leading-relaxed">
              <div className="text-[#82AAFF] font-bold mb-2">Active Configuration:</div>
              <div className="text-[#3B4261] mb-2">─────────────────────────────────────────</div>
              <div className="grid grid-cols-2 gap-y-1 max-w-sm">
                <span className="text-[#676E95]">Provider:</span>
                <span className="text-[#89DDFF] font-semibold">gemini (Free Tier)</span>
                <span className="text-[#676E95]">Chat Model:</span>
                <span className="text-[#C3E88D]">gemini-3.1-flash-lite</span>
                <span className="text-[#676E95]">Embedding Model:</span>
                <span className="text-[#C3E88D]">gemini-embedding-001</span>
                <span className="text-[#676E95]">Gemini Key:</span>
                <span className="text-[#89DDFF]">Configured (active)</span>
                <span className="text-[#676E95]">Offline Mode:</span>
                <span className="text-[#C792EA]">Ollama Ready</span>
              </div>
              <div className="text-[#3B4261] mt-2">─────────────────────────────────────────</div>
            </div>
          )
        }]);
        setIsTyping(false);
      } else {
        // Standard AI Code Intelligence Retrieval
        setMessages(prev => [...prev, {
          id: promptId + '_resp',
          type: 'answer',
          tools: ['src/services/auth.ts', 'src/types/user.ts'],
          duration: '0.4s',
          tokens: '3,842',
          content: (
            <div className="space-y-2.5 text-xs font-mono leading-relaxed">
              <p className="text-[#EEFFFF]">
                Based on AST analysis of <span className="text-[#89DDFF] bg-[#89DDFF]/10 px-1.5 py-0.5 rounded border border-[#89DDFF]/20">src/services/auth.ts:14-64</span>, authentication is governed by the <code className="text-[#FFCB6B] font-bold">AuthService</code> class:
              </p>
              
              <div className="p-3 bg-[#0D1117] rounded-lg border border-[#1F2335] text-[#A6ACCD]">
                <div className="text-[#C792EA] font-semibold mb-1">### 1. Token Verification &amp; Lifecycle</div>
                <ul className="list-disc list-inside space-y-1 text-[#EEFFFF]/90">
                  <li><span className="text-[#82AAFF] font-semibold">AuthService.login</span> validates credentials against SQLite metadata and signs a JWT bearer token (<code className="text-[#89DDFF]">auth.ts:28-34</code>).</li>
                  <li><span className="text-[#C3E88D] font-semibold">Session Renewal</span>: When expired, intercepted by <code className="text-[#FFCB6B]">refreshToken()</code> via client interceptor middleware.</li>
                </ul>
              </div>

              <div className="pt-2 text-[11px] text-[#676E95] border-t border-[#1F2335] flex items-center justify-between">
                <span className="text-[#82AAFF] flex items-center gap-1.5">
                  <span className="text-[#FFCB6B]">↳</span> Evidence: src/services/auth.ts:14-64, src/types/user.ts:8-22
                </span>
                <span className="text-[#C3E88D] font-semibold">Confidence: 99.4%</span>
              </div>
            </div>
          )
        }]);
        setIsTyping(false);
      }
    }, 600);
  };

  useEffect(() => {
    // Initial Greeting message
    setMessages([
      {
        id: 'init_1',
        type: 'answer',
        content: (
          <div className="text-xs font-mono text-[#A6ACCD]">
            <span className="text-[#C3E88D] font-semibold">✔ Ready.</span> Neural AST index active. Type <span className="text-[#89DDFF]">@</span> for suggestions, <span className="text-[#82AAFF]">/diagram</span> for call flows, or click a quick prompt below.
          </div>
        )
      }
    ]);
  }, []);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl bg-[#090A0F] border border-[#2E344A] shadow-2xl shadow-[#000000]/80 overflow-hidden text-left relative">
      {/* Terminal Titlebar */}
      <div className="h-10 bg-[#161922] border-b border-[#1F2335] px-4 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FF5370]/80 hover:opacity-100 transition-opacity" />
          <div className="w-3 h-3 rounded-full bg-[#FFCB6B]/80 hover:opacity-100 transition-opacity" />
          <div className="w-3 h-3 rounded-full bg-[#C3E88D]/80 hover:opacity-100 transition-opacity" />
          <span className="ml-2 text-xs font-mono text-[#676E95] font-medium flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-[#82AAFF]" />
            Kodast (REPL) • /project (main)
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-[#676E95]">
          <span className="flex items-center gap-1.5 text-[#C3E88D]">
            <span className="w-2 h-2 rounded-full bg-[#C3E88D] animate-pulse" />
            Active Index
          </span>
        </div>
      </div>

      {/* Terminal Output Body */}
      <div className="p-4 sm:p-6 font-mono text-xs sm:text-sm min-h-[380px] max-h-[480px] overflow-y-auto space-y-4 scanline bg-[#090A0F]/95">
        {/* Pixel Header Banner */}
        <div className="p-3 rounded-lg bg-[#0D1117]/80 border border-[#1F2335] flex items-center justify-between select-none">
          <div className="flex items-start gap-4">
            {/* 4-row SVG pixel logo */}
            <div className="w-10 h-9 flex flex-col justify-between pt-0.5">
              <div className="flex justify-between h-1.5">
                <div className="w-4 h-1.5 bg-[#FF5370] rounded-xs" />
                <div className="w-4 h-1.5 bg-[#FFCB6B] rounded-xs" />
              </div>
              <div className="flex justify-between h-2.5">
                <div className="w-4 h-2.5 bg-[#FFCB6B] rounded-xs" />
                <div className="w-4 h-2.5 bg-[#C3E88D] rounded-xs" />
              </div>
              <div className="flex justify-between h-2.5">
                <div className="w-4 h-2.5 bg-[#C3E88D] rounded-xs" />
                <div className="w-4 h-2.5 bg-[#89DDFF] rounded-xs" />
              </div>
              <div className="flex justify-between h-1.5">
                <div className="w-4 h-1.5 bg-[#89DDFF] rounded-xs" />
                <div className="w-4 h-1.5 bg-[#C792EA] rounded-xs" />
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-[#82AAFF]">Kodast CLI 0.3.0</div>
              <div className="text-[11px] text-[#676E95]">Local Code Intelligence &amp; REPL</div>
              <div className="text-[11px] text-[#EEFFFF]">Neural AST &amp; Semantic Index Active</div>
            </div>
          </div>
          <div className="hidden sm:block text-[11px] text-[#4F5676] text-right">
            <div>Engine: Gemini / Ollama</div>
            <div className="text-[#C3E88D]">Watch: Syncing in &lt;30ms</div>
          </div>
        </div>

        {/* Message Stream */}
        {messages.map((m) => (
          <div key={m.id} className="space-y-2">
            {m.type === 'prompt' && (
              <div className="flex items-center gap-2 text-[#89DDFF] font-bold text-sm">
                <span>&gt;</span>
                <span className="text-[#EEFFFF] font-normal">{m.query}</span>
              </div>
            )}

            {m.tools && (
              <div className="space-y-1 pl-3 border-l-2 border-[#1F2335]">
                {m.tools.map((t, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-[#A6ACCD]">
                    <span className="text-[#FFCB6B]">●</span>
                    <span className="font-semibold text-[#EEFFFF]">Read</span>
                    <span className="text-[#89DDFF]">({t})</span>
                  </div>
                ))}
                <div className="text-[#676E95] text-[11px] flex items-center gap-1.5 pt-1">
                  <span className="text-[#82AAFF]">▸</span> Thought for {m.duration}, {m.tokens} tokens
                </div>
              </div>
            )}

            {m.content && <div className="pl-3">{m.content}</div>}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-[#89DDFF] pl-3">
            <span className="animate-spin text-[#C3E88D]">⠋</span>
            <span className="text-[#A6ACCD]">Synthesizing grounded answer with AST context...</span>
          </div>
        )}

        <div ref={terminalEndRef} />
      </div>

      {/* Interactive Suggestion Popup Overlay */}
      {showSuggestions && (
        <div className="absolute bottom-16 left-6 right-6 p-2 rounded-xl bg-[#161922] border border-[#3B4261] shadow-2xl z-20 font-mono text-xs backdrop-blur-xl">
          <div className="text-[10px] text-[#676E95] px-2 py-1 border-b border-[#1F2335] flex justify-between">
            <span>SUGGESTIONS (Type to filter, Tab to complete)</span>
            <span className="text-[#82AAFF]">@mention or /command</span>
          </div>
          <div className="mt-1 space-y-0.5">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInput(`explain @${s.name} `);
                  setShowSuggestions(false);
                }}
                className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between transition-colors ${
                  idx === selectedSuggestion ? 'bg-[#82AAFF]/20 text-[#89DDFF]' : 'hover:bg-[#1F2335] text-[#EEFFFF]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#82AAFF] font-bold">&gt;</span>
                  <span className="font-semibold">{s.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1F2335] text-[#C3E88D]">{s.type}</span>
                  <span className="text-[#676E95] text-[11px] hidden sm:inline">{s.detail}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Prompt Selector Pills */}
      <div className="px-4 py-2 bg-[#12141C] border-t border-[#1F2335] flex items-center gap-2 overflow-x-auto select-none">
        <span className="text-[10px] text-[#676E95] uppercase tracking-wider font-mono shrink-0">Try Demo:</span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleRunCommand(p.cmd)}
            disabled={isTyping}
            className="px-2.5 py-1 rounded-md bg-[#161922] hover:bg-[#1F2335] text-[11px] font-mono text-[#A6ACCD] hover:text-[#89DDFF] border border-[#2E344A] transition-all whitespace-nowrap active:scale-95 shrink-0 flex items-center gap-1.5"
          >
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Prompt Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleRunCommand(input);
        }}
        className="p-3 bg-[#161922] border-t border-[#1F2335] flex items-center gap-2"
      >
        <span className="text-[#89DDFF] font-mono font-bold text-base pl-2">&gt;</span>
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (e.target.value.includes('@') || e.target.value.startsWith('/')) {
              setShowSuggestions(true);
            } else {
              setShowSuggestions(false);
            }
          }}
          placeholder="Ask anything, type @ for files/symbols, or /diagram..."
          className="flex-1 bg-transparent border-none outline-none font-mono text-xs sm:text-sm text-[#EEFFFF] placeholder:text-[#4F5676]"
        />
        <button
          type="submit"
          disabled={isTyping || !input.trim()}
          className="p-1.5 rounded-lg bg-[#82AAFF]/20 text-[#89DDFF] hover:bg-[#82AAFF]/30 disabled:opacity-40 transition-all active:scale-95"
        >
          <CornerDownLeft className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
