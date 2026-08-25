import React, { useState } from 'react';
import { Shield, Zap, FolderTree, Cpu, Activity, Search, Lock } from 'lucide-react';

export const Features: React.FC = () => {
  const [offlineMode, setOfflineMode] = useState(false);
  const [watcherSaved, setWatcherSaved] = useState(false);

  const triggerWatchPulse = () => {
    setWatcherSaved(true);
    setTimeout(() => setWatcherSaved(false), 2000);
  };

  return (
    <section id="features" className="py-20 md:py-32 bg-[#090A0F] border-t border-[#1F2335]/60 relative scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#82AAFF]/10 text-xs font-mono text-[#89DDFF] border border-[#82AAFF]/30 mb-4">
            <Cpu className="w-3.5 h-3.5" />
            ENGINE ARCHITECTURE
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#EEFFFF] tracking-tight mb-4">
            Engineered For Deep Codebase Intelligence.
          </h2>
          <p className="text-[#A6ACCD] text-base sm:text-lg leading-relaxed">
            Forget naive text searching. Kodast compiles your codebase into a structured relational knowledge graph and neural vector index.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Feature 1: Live @ Autocomplete */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0D1117] border border-[#2E344A] hover:border-[#82AAFF]/50 transition-all group flex flex-col justify-between shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#82AAFF]/10 border border-[#82AAFF]/30 flex items-center justify-center text-[#82AAFF] mb-6 group-hover:scale-110 transition-transform">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#EEFFFF] mb-3 flex items-center gap-2">
                Live In-Place Autocomplete
              </h3>
              <p className="text-sm text-[#A6ACCD] leading-relaxed mb-6">
                Type <code className="text-[#89DDFF]">@</code> inside the REPL for instant inline popups across files, folders, and AST symbols. Mentioned targets get automatically boosted with a <code className="text-[#C3E88D]">100.0</code> relevance score.
              </p>
            </div>
            
            {/* Visual simulation card */}
            <div className="p-3 bg-[#090A0F] rounded-xl border border-[#1F2335] font-mono text-xs text-[#EEFFFF]">
              <div className="text-[10px] text-[#676E95] mb-1">&gt; explain @auth</div>
              <div className="p-1.5 rounded bg-[#161922] border border-[#82AAFF]/40 text-[#89DDFF] flex justify-between items-center">
                <span>&gt; src/services/authService.ts</span>
                <span className="text-[10px] text-[#C3E88D] bg-[#C3E88D]/10 px-1 rounded">Score: 100.0</span>
              </div>
            </div>
          </div>

          {/* Feature 2: Sub-30ms Background Watcher */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0D1117] border border-[#2E344A] hover:border-[#C3E88D]/50 transition-all group flex flex-col justify-between shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#C3E88D]/10 border border-[#C3E88D]/30 flex items-center justify-center text-[#C3E88D] mb-6 group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#EEFFFF] mb-3">
                &lt; 30ms Background Watcher
              </h3>
              <p className="text-sm text-[#A6ACCD] leading-relaxed mb-6">
                While you chat, a silent background file watcher tracks modifications. Saving a file in your IDE immediately triggers an incremental AST delta parse without re-indexing the whole repo.
              </p>
            </div>

            {/* Interactive save demo trigger */}
            <div className="p-3 bg-[#090A0F] rounded-xl border border-[#1F2335] font-mono text-xs">
              <button
                onClick={triggerWatchPulse}
                className="w-full py-2 px-3 rounded-lg bg-[#161922] hover:bg-[#1F2335] border border-[#2E344A] text-left flex items-center justify-between text-[#EEFFFF] transition-all"
              >
                <span>Save file in VS Code (Cmd+S)</span>
                <span className="text-[10px] text-[#89DDFF] bg-[#89DDFF]/10 px-2 py-0.5 rounded">Simulate</span>
              </button>
              {watcherSaved ? (
                <div className="mt-2 text-[11px] text-[#C3E88D] flex items-center gap-1.5 animate-fade-in">
                  <span className="w-2 h-2 rounded-full bg-[#C3E88D] animate-ping" />
                  AST Delta synced in 24ms (1 file, 3 symbols updated)
                </div>
              ) : (
                <div className="mt-2 text-[11px] text-[#676E95]">Silent background watcher active</div>
              )}
            </div>
          </div>

          {/* Feature 3: 100% Offline Local Privacy */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0D1117] border border-[#2E344A] hover:border-[#C792EA]/50 transition-all group flex flex-col justify-between shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#C792EA]/10 border border-[#C792EA]/30 flex items-center justify-center text-[#C792EA] mb-6 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#EEFFFF] mb-3">
                100% Offline Local Mode
              </h3>
              <p className="text-sm text-[#A6ACCD] leading-relaxed mb-6">
                Air-gapped enterprise privacy. Switch to Ollama to run local embedding models (<code className="text-[#C792EA]">nomic-embed-text</code>) and code LLMs (<code className="text-[#C792EA]">qwen2.5-coder</code>) with 0 data sent to the cloud.
              </p>
            </div>

            {/* Interactive Toggle */}
            <div className="p-3 bg-[#090A0F] rounded-xl border border-[#1F2335] font-mono text-xs flex items-center justify-between">
              <div>
                <div className="text-[#EEFFFF] font-semibold">{offlineMode ? 'Local Ollama' : 'Google Gemini'}</div>
                <div className="text-[10px] text-[#676E95]">{offlineMode ? 'Zero cloud telemetry' : 'Free tier enabled'}</div>
              </div>
              <button
                onClick={() => setOfflineMode(!offlineMode)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  offlineMode ? 'bg-[#C792EA]' : 'bg-[#1F2335]'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-[#EEFFFF] transition-transform ${offlineMode ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Feature 4: Visual Diagram Generator */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0D1117] border border-[#2E344A] hover:border-[#FFCB6B]/50 transition-all group flex flex-col justify-between shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#FFCB6B]/10 border border-[#FFCB6B]/30 flex items-center justify-center text-[#FFCB6B] mb-6 group-hover:scale-110 transition-transform">
                <FolderTree className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#EEFFFF] mb-3">
                Visual Architecture &amp; Call Flows
              </h3>
              <p className="text-sm text-[#A6ACCD] leading-relaxed mb-6">
                Type <code className="text-[#FFCB6B]">/diagram</code> in REPL to generate Mermaid architectural dependency graphs (<code className="text-[#89DDFF]">graph TD</code>), sequence call flows, or terminal ASCII flows on any file or module.
              </p>
            </div>

            <div className="p-3 bg-[#090A0F] rounded-xl border border-[#1F2335] font-mono text-xs text-[#EEFFFF] flex items-center justify-between">
              <span className="text-[#FFCB6B]">&gt; /diagram auth</span>
              <span className="text-[10px] text-[#82AAFF] bg-[#82AAFF]/10 px-2 py-0.5 rounded border border-[#82AAFF]/20">Mermaid Rendered</span>
            </div>
          </div>

          {/* Feature 5: Multi-Turn Memory & Fast-Path */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0D1117] border border-[#2E344A] hover:border-[#FF5370]/50 transition-all group flex flex-col justify-between shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#FF5370]/10 border border-[#FF5370]/30 flex items-center justify-center text-[#FF5370] mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#EEFFFF] mb-3">
                Conversational Memory &amp; Fast Path
              </h3>
              <p className="text-sm text-[#A6ACCD] leading-relaxed mb-6">
                Maintains multi-turn context with sliding-window token budgets. Common greetings (`hey`, `thanks`) answer instantly in &lt;1ms with 0 token waste and zero vector lookups.
              </p>
            </div>

            <div className="p-3 bg-[#090A0F] rounded-xl border border-[#1F2335] font-mono text-xs flex items-center justify-between">
              <span className="text-[#89DDFF]">&gt; hey</span>
              <span className="text-[10px] text-[#C3E88D] bg-[#C3E88D]/10 px-2 py-0.5 rounded">0 Tokens (0ms)</span>
            </div>
          </div>

          {/* Feature 6: Grounded Exact Citations */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0D1117] border border-[#2E344A] hover:border-[#89DDFF]/50 transition-all group flex flex-col justify-between shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#89DDFF]/10 border border-[#89DDFF]/30 flex items-center justify-center text-[#89DDFF] mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#EEFFFF] mb-3">
                Zero Hallucination Citations
              </h3>
              <p className="text-sm text-[#A6ACCD] leading-relaxed mb-6">
                Every technical claim is backed by exact file and line-range evidence (e.g. <code className="text-[#89DDFF]">src/services/auth.ts:14-48</code>) verified against the local AST relational graph.
              </p>
            </div>

            <div className="p-3 bg-[#090A0F] rounded-xl border border-[#1F2335] font-mono text-xs text-[#C3E88D] flex items-center gap-2">
              <span>↳ Evidence: filters.ts:8-107</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
