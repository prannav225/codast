import React, { useState } from 'react';
import { TerminalSandbox } from './TerminalSandbox';
import { Copy, Check, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Hero: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'npm' | 'npx' | 'curl'>('npm');
  const [copied, setCopied] = useState(false);

  const installCommands = {
    npm: 'npm install -g @pra9v/kodast',
    npx: 'npx @pra9v/kodast',
    curl: 'curl -fsSL https://raw.githubusercontent.com/prannav225/kodast/main/install.sh | bash'
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(installCommands[activeTab]);
    setCopied(true);
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.25 }
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden bg-grid-pattern">
      {/* Ambient background glow blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-[#82AAFF]/15 via-[#C792EA]/10 to-[#89DDFF]/15 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Top Feature Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161922] border border-[#2E344A] text-xs font-mono text-[#89DDFF] mb-8 shadow-sm hover:border-[#82AAFF]/50 transition-colors">
          <span className="flex h-2 w-2 rounded-full bg-[#C3E88D] animate-ping" />
          <span>v0.2.0 is live with Live @-Autocomplete &amp; 100% Offline Ollama</span>
          <ArrowRight className="w-3 h-3 text-[#676E95]" />
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#EEFFFF] max-w-4xl mx-auto leading-[1.1] mb-6">
          The Neural Codebase Intelligence Engine for Your{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5370] via-[#FFCB6B] to-[#89DDFF]">
            Terminal.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg lg:text-xl text-[#A6ACCD] max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Instant polyglot AST parsing, SQLite relational call graphs, local vector retrieval, and grounded line citations — right inside your interactive REPL.
        </p>

        {/* 1-Click Install Command Bar */}
        <div className="max-w-xl mx-auto mb-16">
          {/* Tabs */}
          <div className="flex items-center justify-center gap-2 mb-2">
            {(['npm', 'npx', 'curl'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
                  activeTab === tab
                    ? 'bg-[#1F2335] text-[#89DDFF] font-semibold border border-[#3B4261]'
                    : 'text-[#676E95] hover:text-[#EEFFFF]'
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Command box */}
          <div
            onClick={handleCopy}
            className="group relative flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-[#0D1117] border border-[#2E344A] hover:border-[#82AAFF]/50 shadow-2xl transition-all cursor-pointer select-all font-mono text-xs sm:text-sm text-[#C3E88D]"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="text-[#676E95] font-bold select-none">$</span>
              <span className="truncate">{installCommands[activeTab]}</span>
            </div>
            <button
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#161922] group-hover:bg-[#1F2335] text-xs text-[#A6ACCD] border border-[#2E344A] transition-colors shrink-0"
              title="Copy to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#C3E88D]" />
                  <span className="text-[#C3E88D]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#676E95] group-hover:text-[#EEFFFF]" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="text-[11px] text-[#676E95] font-mono mt-2">
            ✨ Only 1 free Gemini API key needed (or 0 keys with offline Ollama)
          </div>
        </div>

        {/* Live Terminal Sandbox Simulator */}
        <div id="terminal-demo" className="pt-4 scroll-mt-20">
          <TerminalSandbox />
        </div>
      </div>
    </section>
  );
};
