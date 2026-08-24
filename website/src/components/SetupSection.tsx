import React, { useState } from 'react';
import { Key, Check, Copy } from 'lucide-react';
import confetti from 'canvas-confetti';

export const SetupSection: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'gemini' | 'ollama' | 'voyage'>('gemini');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.8 }
    });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <section id="setup" className="py-20 md:py-32 bg-[#0D1117] border-t border-[#1F2335]/60 relative scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFCB6B]/10 text-xs font-mono text-[#FFCB6B] border border-[#FFCB6B]/30 mb-4">
            <Key className="w-3.5 h-3.5" />
            ZERO COMPLEXITY
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#EEFFFF] tracking-tight mb-4">
            Up and Running in 30 Seconds.
          </h2>
          <p className="text-[#A6ACCD] text-base sm:text-lg leading-relaxed">
            Configure once globally in <code className="text-[#89DDFF]">~/.codebase-ai/config.json</code>. Works across all repositories on your system.
          </p>
        </div>

        {/* Setup Mode Selector Tabs */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 max-w-xl mx-auto mb-10">
          <button
            onClick={() => setActiveMode('gemini')}
            className={`flex-1 p-3.5 rounded-xl border text-center font-mono transition-all ${
              activeMode === 'gemini'
                ? 'bg-[#161922] text-[#89DDFF] border-[#82AAFF] shadow-lg shadow-[#82AAFF]/15'
                : 'bg-[#090A0F] text-[#676E95] border-[#1F2335] hover:border-[#3B4261]'
            }`}
          >
            <div className="text-xs font-bold">1. Google Gemini</div>
            <div className="text-[10px] text-[#C3E88D]">1 Key • Free Tier</div>
          </button>

          <button
            onClick={() => setActiveMode('ollama')}
            className={`flex-1 p-3.5 rounded-xl border text-center font-mono transition-all ${
              activeMode === 'ollama'
                ? 'bg-[#161922] text-[#C792EA] border-[#C792EA] shadow-lg shadow-[#C792EA]/15'
                : 'bg-[#090A0F] text-[#676E95] border-[#1F2335] hover:border-[#3B4261]'
            }`}
          >
            <div className="text-xs font-bold">2. Local Ollama</div>
            <div className="text-[10px] text-[#82AAFF]">0 Keys • 100% Offline</div>
          </button>

          <button
            onClick={() => setActiveMode('voyage')}
            className={`flex-1 p-3.5 rounded-xl border text-center font-mono transition-all ${
              activeMode === 'voyage'
                ? 'bg-[#161922] text-[#FFCB6B] border-[#FFCB6B] shadow-lg shadow-[#FFCB6B]/15'
                : 'bg-[#090A0F] text-[#676E95] border-[#1F2335] hover:border-[#3B4261]'
            }`}
          >
            <div className="text-xs font-bold">3. Voyage Hybrid</div>
            <div className="text-[10px] text-[#FF5370]">2 Keys • SOTA Embeds</div>
          </button>
        </div>

        {/* Configuration Code Card */}
        <div className="max-w-2xl mx-auto rounded-2xl bg-[#090A0F] border border-[#2E344A] p-6 sm:p-8 font-mono text-xs sm:text-sm shadow-2xl">
          {activeMode === 'gemini' && (
            <div className="space-y-4">
              <div className="text-[#89DDFF] font-semibold text-sm"># Option 1: Standard Setup (Single Key)</div>
              <p className="text-xs text-[#A6ACCD]">Gemini handles both reasoning (3.1 Flash Lite) and embeddings (001) for free.</p>
              
              <div className="p-3 bg-[#161922] rounded-xl border border-[#1F2335] flex items-center justify-between">
                <span className="text-[#C3E88D]">codast config set api-key &lt;YOUR_GEMINI_KEY&gt;</span>
                <button
                  onClick={() => copyToClipboard('codast config set api-key <YOUR_GEMINI_KEY>', 'gem1')}
                  className="p-1.5 rounded bg-[#0D1117] hover:bg-[#1F2335] text-[#676E95] hover:text-[#EEFFFF]"
                >
                  {copiedKey === 'gem1' ? <Check className="w-3.5 h-3.5 text-[#C3E88D]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="p-3 bg-[#161922] rounded-xl border border-[#1F2335] flex items-center justify-between">
                <span className="text-[#C3E88D]">codast</span>
                <button
                  onClick={() => copyToClipboard('codast', 'gem2')}
                  className="p-1.5 rounded bg-[#0D1117] hover:bg-[#1F2335] text-[#676E95] hover:text-[#EEFFFF]"
                >
                  {copiedKey === 'gem2' ? <Check className="w-3.5 h-3.5 text-[#C3E88D]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {activeMode === 'ollama' && (
            <div className="space-y-4">
              <div className="text-[#C792EA] font-semibold text-sm"># Option 2: 100% Offline Local Mode (Zero Keys)</div>
              <p className="text-xs text-[#A6ACCD]">Zero internet connection needed. Uses your local Ollama models.</p>
              
              <div className="p-3 bg-[#161922] rounded-xl border border-[#1F2335] flex items-center justify-between">
                <span className="text-[#C3E88D]">codast config set provider ollama</span>
                <button
                  onClick={() => copyToClipboard('codast config set provider ollama', 'ol1')}
                  className="p-1.5 rounded bg-[#0D1117] hover:bg-[#1F2335] text-[#676E95] hover:text-[#EEFFFF]"
                >
                  {copiedKey === 'ol1' ? <Check className="w-3.5 h-3.5 text-[#C3E88D]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="p-3 bg-[#161922] rounded-xl border border-[#1F2335] flex items-center justify-between">
                <span className="text-[#C3E88D]">codast</span>
                <button
                  onClick={() => copyToClipboard('codast', 'ol2')}
                  className="p-1.5 rounded bg-[#0D1117] hover:bg-[#1F2335] text-[#676E95] hover:text-[#EEFFFF]"
                >
                  {copiedKey === 'ol2' ? <Check className="w-3.5 h-3.5 text-[#C3E88D]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {activeMode === 'voyage' && (
            <div className="space-y-4">
              <div className="text-[#FFCB6B] font-semibold text-sm"># Option 3: Voyage AI + Gemini (Power User)</div>
              <p className="text-xs text-[#A6ACCD]">Uses Voyage AI's code-specialized embeddings with Gemini reasoning.</p>
              
              <div className="p-3 bg-[#161922] rounded-xl border border-[#1F2335] flex items-center justify-between">
                <span className="text-[#C3E88D]">codast config set voyage-key &lt;VOYAGE_KEY&gt;</span>
                <button
                  onClick={() => copyToClipboard('codast config set voyage-key <VOYAGE_KEY>', 'voy1')}
                  className="p-1.5 rounded bg-[#0D1117] hover:bg-[#1F2335] text-[#676E95] hover:text-[#EEFFFF]"
                >
                  {copiedKey === 'voy1' ? <Check className="w-3.5 h-3.5 text-[#C3E88D]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="p-3 bg-[#161922] rounded-xl border border-[#1F2335] flex items-center justify-between">
                <span className="text-[#C3E88D]">codast config set api-key &lt;GEMINI_KEY&gt;</span>
                <button
                  onClick={() => copyToClipboard('codast config set api-key <GEMINI_KEY>', 'voy2')}
                  className="p-1.5 rounded bg-[#0D1117] hover:bg-[#1F2335] text-[#676E95] hover:text-[#EEFFFF]"
                >
                  {copiedKey === 'voy2' ? <Check className="w-3.5 h-3.5 text-[#C3E88D]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
