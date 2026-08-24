import React, { useState } from 'react';
import { Terminal, Command } from 'lucide-react';

export const CommandMatrix: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'repl' | 'cli'>('repl');

  const replCommands = [
    { cmd: '/diagram [target]', desc: 'Generate Mermaid dependency graphs (graph TD), sequence flows, or ASCII trees' },
    { cmd: '/tree [path]', desc: 'Visualize codebase folder hierarchy with file line counts' },
    { cmd: '/status', desc: 'Display indexed files, symbol counts, call edges, and active embedding provider' },
    { cmd: '/files [filter]', desc: 'List all indexed source files with instant fuzzy search' },
    { cmd: '/config', desc: 'Inspect active API keys, provider settings, and model configurations' },
    { cmd: '/reset', desc: 'Clear active conversation memory and reset token context' },
    { cmd: '/index', desc: 'Force a full repository re-scan, AST parsing, and vector sync' },
    { cmd: '/clear', desc: 'Clear the terminal screen and reset view' },
  ];

  const cliCommands = [
    { cmd: 'codast', desc: 'Launch the interactive REPL with live @-autocomplete and background watcher' },
    { cmd: 'codast ask "<prompt>"', desc: 'Run a one-off grounded intelligence query directly from your bash/zsh shell' },
    { cmd: 'codast diagram [target]', desc: 'Generate visual architecture diagrams or ASCII call graphs directly in CLI' },
    { cmd: 'codast watch', desc: 'Run the standalone real-time background filesystem watcher daemon' },
    { cmd: 'codast index --force', desc: 'Force complete clean re-indexing of all repository files' },
    { cmd: 'codast status', desc: 'Display global and project-specific index statistics' },
  ];

  return (
    <section className="py-20 bg-[#000000] text-white border-b border-white/[0.1] font-mono text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Blueprint Container */}
        <div className="relative border border-white/[0.15] bg-[#000000] p-6 sm:p-12 mb-12">
          
          {/* Corner Crosshairs */}
          <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 font-mono text-white text-lg select-none">+</div>
          <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 font-mono text-white text-lg select-none">+</div>
          <div className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 font-mono text-white text-lg select-none">+</div>
          <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 font-mono text-white text-lg select-none">+</div>

          {/* Section Header */}
          <div className="max-w-3xl mb-10">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#111111] text-[11px] text-[#888888] border border-white/10 mb-4">
              <span>05 // COMMAND REFERENCE</span>
            </div>
            <h2 className="text-4xl sm:text-6xl font-pixel tracking-tight text-white mb-4">
              Commands.
            </h2>
            <p className="text-sm sm:text-base text-[#888888] leading-relaxed">
              Execute commands seamlessly inside the interactive REPL or directly from your terminal shell.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setActiveTab('repl')}
              className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-2 ${
                activeTab === 'repl'
                  ? 'bg-white text-black border-white'
                  : 'bg-[#0A0A0A] text-[#888888] border-white/10 hover:border-white/30 hover:text-white'
              }`}
            >
              <Command className="w-3.5 h-3.5" />
              In-REPL Commands (/)
            </button>

            <button
              onClick={() => setActiveTab('cli')}
              className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-2 ${
                activeTab === 'cli'
                  ? 'bg-white text-black border-white'
                  : 'bg-[#0A0A0A] text-[#888888] border-white/10 hover:border-white/30 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Shell CLI
            </button>
          </div>

          {/* Commands Table Grid with 1px Borders */}
          <div className="border border-white/[0.15] bg-[#0A0A0A] overflow-hidden text-xs">
            <div className="p-4 bg-[#0D0D0D] border-b border-white/[0.1] text-[#888888] flex justify-between text-[11px] font-pixel">
              <span>COMMAND</span>
              <span>FUNCTION &amp; CAPABILITY</span>
            </div>

            <div className="divide-y divide-white/[0.08]">
              {(activeTab === 'repl' ? replCommands : cliCommands).map((item, idx) => (
                <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#141414] transition-colors">
                  <span className="font-bold text-white shrink-0 sm:w-64">
                    {item.cmd}
                  </span>
                  <span className="text-[#888888] text-xs">
                    {item.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Keyboard Shortcuts HUD */}
          <div className="mt-8 p-4 rounded-xl bg-[#0A0A0A] border border-white/[0.1] flex flex-wrap items-center justify-between gap-4 text-xs text-[#666666]">
            <div className="flex items-center gap-2 text-white">
              <span className="font-bold font-pixel">KEYBOARD SHORTCUTS:</span>
            </div>
            <div className="flex items-center gap-6 flex-wrap text-[11px]">
              <span><kbd className="px-1.5 py-0.5 rounded bg-[#161616] border border-white/10 text-white">@</kbd> Trigger Mention</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-[#161616] border border-white/10 text-white">/</kbd> Slash Commands</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-[#161616] border border-white/10 text-white">Tab</kbd> Autocomplete</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-[#161616] border border-white/10 text-white">↑ / ↓</kbd> Scrub Suggestions</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
