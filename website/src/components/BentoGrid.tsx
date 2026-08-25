import React, { useState } from 'react';
import { Shield, Lock } from 'lucide-react';

export const BentoGrid: React.FC = () => {
  const [simulatedSaveTime, setSimulatedSaveTime] = useState<number | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const triggerSaveSimulation = () => {
    const randomMs = Math.floor(Math.random() * 12) + 16; // 16-28ms
    setSimulatedSaveTime(randomMs);
    setTimeout(() => setSimulatedSaveTime(null), 2500);
  };

  return (
    <section id="bento" className="py-12 sm:py-20 bg-[#000000] text-white border-b border-white/[0.1] font-mono scroll-mt-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Blueprint Container */}
        <div className="relative border border-white/[0.15] bg-[#000000] p-4 sm:p-8 lg:p-12 mb-12 overflow-hidden">
          
          {/* Corner Crosshairs */}
          <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 font-mono text-white text-base sm:text-lg select-none">+</div>
          <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 font-mono text-white text-base sm:text-lg select-none">+</div>
          <div className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 font-mono text-white text-base sm:text-lg select-none">+</div>
          <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 font-mono text-white text-base sm:text-lg select-none">+</div>

          {/* Section Header */}
          <div className="max-w-3xl mb-8 sm:mb-12 text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#111111] text-[10px] sm:text-[11px] text-[#888888] border border-white/10 mb-3 sm:mb-4">
              <span>02 // COGNITION SUPERPOWERS</span>
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-pixel text-white mb-3 sm:mb-4">
              Architecture.
            </h2>
            <p className="text-xs sm:text-sm lg:text-base text-[#888888] leading-relaxed">
              Engineered from the ground up for developers who demand sub-millisecond local latency, relational AST intelligence, and air-gapped privacy.
            </p>
          </div>

          {/* 1px Grid Bento Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 border border-white/[0.15] divide-y lg:divide-y-0 divide-white/[0.15] text-left">
            
            {/* Box 1 (Span 7): Deterministic @-Mention Resolution */}
            <div className="lg:col-span-7 p-4 sm:p-8 lg:border-r border-white/[0.15] flex flex-col justify-between space-y-6 overflow-hidden">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/10 text-[10px] text-white border border-white/20 mb-3">
                  PRIORITY BOOSTING (100.0)
                </div>
                <h3 className="text-lg sm:text-2xl font-pixel text-white mb-2">
                  Mentions.
                </h3>
                <p className="text-xs sm:text-sm text-[#888888] leading-relaxed mb-6">
                  Unlike naive vector search that guesses random files on ambiguous questions, typing <code className="text-white bg-white/10 px-1 py-0.5 rounded">@file</code> or <code className="text-white bg-white/10 px-1 py-0.5 rounded">@symbol</code> instantly pulls exact AST definitions with maximum relevance score.
                </p>
              </div>

              {/* Interactive Scoring HUD (Guaranteed Zero Overflow) */}
              <div className="p-3 sm:p-4 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs space-y-3 max-w-full overflow-hidden">
                <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-[#666666] pb-2 border-b border-white/5 gap-2">
                  <span className="truncate">QUERY WITH @-MENTION</span>
                  <span className="text-white font-bold shrink-0 font-mono">SCORE: 100.0</span>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 max-w-full">
                  <span className="text-white font-bold shrink-0">&gt;</span>
                  <span className="text-[#EDEDED] shrink-0 text-xs">explain</span>
                  <div className="text-black bg-white px-2 py-0.5 rounded font-bold text-[10px] sm:text-xs truncate min-w-0 shrink">
                    <span className="sm:hidden">@authService.ts</span>
                    <span className="hidden sm:inline">@src/services/authService.ts</span>
                  </div>
                </div>

                {/* Calculation HUD */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-2 text-[9px] sm:text-[10px] text-center border-t border-white/5">
                  <div className="p-1.5 sm:p-2 bg-[#000000] rounded border border-white/10 text-[#888888] truncate">
                    <div className="truncate text-[8px] sm:text-[9px]">AST Match</div>
                    <div className="text-white font-bold font-mono text-[10px] sm:text-xs">+50.0</div>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-[#000000] rounded border border-white/10 text-[#888888] truncate">
                    <div className="truncate text-[8px] sm:text-[9px]">Mention</div>
                    <div className="text-white font-bold font-mono text-[10px] sm:text-xs">+30.0</div>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-[#000000] rounded border border-white/10 text-[#888888] truncate">
                    <div className="truncate text-[8px] sm:text-[9px]">Relevance</div>
                    <div className="text-white font-bold font-mono text-[10px] sm:text-xs">+20.0</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Box 2 (Span 5): 0-Token Fast-Path Benchmark */}
            <div className="lg:col-span-5 p-4 sm:p-8 flex flex-col justify-between space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/10 text-[10px] text-white border border-white/20 mb-3">
                  TOKEN ECONOMY BENCHMARK
                </div>
                <h3 className="text-lg sm:text-2xl font-pixel text-white mb-2">
                  Token Fast-Path.
                </h3>
                <p className="text-xs sm:text-sm text-[#888888] leading-relaxed mb-6">
                  Saying "hey" or "thanks" won't dump 8,000 tokens of random code into context. Codast classifies conversational intent in &lt;1ms.
                </p>
              </div>

              {/* Benchmark Visual Bar */}
              <div className="space-y-3 text-xs">
                <div className="p-3 sm:p-3.5 bg-[#0A0A0A] rounded-xl border border-white/10 space-y-2">
                  <div className="flex justify-between text-[10px] sm:text-[11px]">
                    <span className="text-[#888888]">Standard AI Assistant:</span>
                    <span className="text-white">8,686 tokens</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                    <div className="w-full h-full bg-[#555555]" />
                  </div>
                </div>

                <div className="p-3 sm:p-3.5 bg-[#0A0A0A] rounded-xl border border-white/30 space-y-2">
                  <div className="flex justify-between text-[10px] sm:text-[11px]">
                    <span className="text-white font-bold">Codast Fast-Path:</span>
                    <span className="text-white font-bold">0 tokens (&lt; 1ms)</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                    <div className="w-2 h-full bg-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Box 3 (Span 5): Sub-30ms Incremental Watcher */}
            <div className="lg:col-span-5 p-4 sm:p-8 lg:border-r lg:border-t border-t border-white/[0.15] flex flex-col justify-between space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/10 text-[10px] text-white border border-white/20 mb-3">
                  REAL-TIME SYNC
                </div>
                <h3 className="text-lg sm:text-2xl font-pixel text-white mb-2">
                  Watcher.
                </h3>
                <p className="text-xs sm:text-sm text-[#888888] leading-relaxed mb-6">
                  Edit code in VS Code, Cursor, or Neovim — Codast re-indexes only modified AST nodes on save without pausing your chat.
                </p>
              </div>

              {/* Interactive Save Button (Guaranteed Clean Single Line) */}
              <div className="p-3.5 sm:p-4 bg-[#0A0A0A] rounded-xl border border-white/10 text-xs">
                <button
                  onClick={triggerSaveSimulation}
                  className="w-full py-2 px-3 rounded-lg bg-[#161616] hover:bg-[#222222] border border-white/10 flex items-center justify-between text-white transition-all active:scale-95 whitespace-nowrap gap-2"
                >
                  <span className="font-mono text-[11px] sm:text-xs">
                    Save file <span className="text-[#888888] hidden sm:inline">(Cmd+S)</span>
                  </span>
                  <span className="text-[9px] sm:text-[10px] bg-white text-black font-bold px-2 py-0.5 rounded shrink-0 font-pixel">
                    Trigger
                  </span>
                </button>

                <div className="mt-3 text-[10px] sm:text-[11px] flex items-center justify-between pt-2 border-t border-white/5 font-mono">
                  <span className="text-[#666666]">AST Latency:</span>
                  <span className="text-white font-bold">
                    {simulatedSaveTime ? `${simulatedSaveTime}ms (Synced)` : '< 30ms (Instant)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Box 4 (Span 7): 100% Offline Privacy */}
            <div className="lg:col-span-7 p-4 sm:p-8 lg:border-t border-t border-white/[0.15] flex flex-col justify-between space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/10 text-[10px] text-white border border-white/20 mb-3">
                  AIR-GAPPED COMPLIANCE
                </div>
                <h3 className="text-lg sm:text-2xl font-pixel text-white mb-2">
                  Air-Gapped.
                </h3>
                <p className="text-xs sm:text-sm text-[#888888] leading-relaxed mb-6">
                  Zero proprietary code leaves your disk. Toggle between Google Gemini (free tier) and local Ollama (<code className="text-white bg-white/10 px-1 py-0.5 rounded">qwen2.5-coder</code>) with one command.
                </p>
              </div>

              {/* Interactive Toggle Card */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 truncate">
                    {isOffline ? <Lock className="w-3.5 h-3.5 text-white shrink-0" /> : <Shield className="w-3.5 h-3.5 text-white shrink-0" />}
                    <span className="truncate">{isOffline ? '100% Offline (Ollama)' : 'Google Gemini (Free)'}</span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-[#666666] mt-0.5 truncate">
                    {isOffline ? '0 data packets over internet' : 'Default 1-key setup with Gemini Flash'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOffline(!isOffline)}
                  className={`w-12 h-6.5 rounded-full p-0.5 transition-colors relative shrink-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none ${
                    isOffline ? 'bg-white' : 'bg-[#1A1A1A] border border-white/20'
                  }`}
                  style={{ outline: 'none', boxShadow: 'none' }}
                >
                  <div className={`w-5 h-5 rounded-full transition-transform ${isOffline ? 'translate-x-5.5 bg-black' : 'translate-x-0 bg-white'}`} />
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
