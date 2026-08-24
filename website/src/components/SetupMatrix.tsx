import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import confetti from 'canvas-confetti';

export const SetupMatrix: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'gemini' | 'ollama' | 'voyage'>('gemini');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    confetti({
      particleCount: 25,
      spread: 45,
      origin: { y: 0.85 }
    });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <section id="setup" className="py-20 bg-[#000000] text-white border-b border-white/[0.1] font-mono scroll-mt-16 text-left">
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
              <span>04 // CONFIGURATION MATRIX</span>
            </div>
            <h2 className="text-4xl sm:text-6xl font-pixel tracking-tight text-white mb-4">
              Setup.
            </h2>
            <p className="text-sm sm:text-base text-[#888888] leading-relaxed">
              Configure once in <code className="text-white bg-white/10 px-1 py-0.5 rounded">~/.codebase-ai/config.json</code>. Codast automatically detects your repository and runs seamlessly.
            </p>
          </div>

          {/* Mode Selector HUD */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mb-8">
            
            <button
              onClick={() => setActiveMode('gemini')}
              className={`p-4 rounded-xl border text-left transition-all ${
                activeMode === 'gemini'
                  ? 'bg-[#111111] border-white text-white shadow-lg'
                  : 'bg-[#0A0A0A] border-white/10 text-[#888888] hover:border-white/30 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-pixel">1. GOOGLE GEMINI</span>
                <span className="text-[10px] bg-white text-black font-bold px-1.5 py-0.2 rounded font-pixel">1 KEY</span>
              </div>
              <div className="text-[11px] text-[#666666]">Default Setup • Free Tier Friendly</div>
            </button>

            <button
              onClick={() => setActiveMode('ollama')}
              className={`p-4 rounded-xl border text-left transition-all ${
                activeMode === 'ollama'
                  ? 'bg-[#111111] border-white text-white shadow-lg'
                  : 'bg-[#0A0A0A] border-white/10 text-[#888888] hover:border-white/30 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-pixel">2. LOCAL OLLAMA</span>
                <span className="text-[10px] bg-white text-black font-bold px-1.5 py-0.2 rounded font-pixel">0 KEYS</span>
              </div>
              <div className="text-[11px] text-[#666666]">100% Offline • Air-Gapped Privacy</div>
            </button>

            <button
              onClick={() => setActiveMode('voyage')}
              className={`p-4 rounded-xl border text-left transition-all ${
                activeMode === 'voyage'
                  ? 'bg-[#111111] border-white text-white shadow-lg'
                  : 'bg-[#0A0A0A] border-white/10 text-[#888888] hover:border-white/30 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-pixel">3. VOYAGE HYBRID</span>
                <span className="text-[10px] bg-white text-black font-bold px-1.5 py-0.2 rounded font-pixel">2 KEYS</span>
              </div>
              <div className="text-[11px] text-[#666666]">voyage-code-2 • Power User</div>
            </button>

          </div>

          {/* Configuration Terminal Box */}
          <div className="max-w-4xl rounded-2xl bg-[#0A0A0A] border border-white/[0.15] p-6 sm:p-8 text-xs sm:text-sm shadow-2xl space-y-4">
            {activeMode === 'gemini' && (
              <>
                <div className="flex items-center justify-between text-xs text-[#666666] pb-2 border-b border-white/5 font-pixel">
                  <span>GEMINI SETUP (Both reasoning &amp; embeddings handled by 1 key)</span>
                  <span className="text-white">RECOMMENDED</span>
                </div>

                <div className="p-3.5 bg-[#000000] rounded-xl border border-white/10 flex items-center justify-between">
                  <span className="text-white">$ codast config set api-key &lt;YOUR_GEMINI_KEY&gt;</span>
                  <button
                    onClick={() => copyToClipboard('codast config set api-key <YOUR_GEMINI_KEY>', 'gem1')}
                    className="p-1 rounded bg-[#161616] hover:bg-[#222222] text-[#888888] hover:text-white"
                  >
                    {copiedKey === 'gem1' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="p-3.5 bg-[#000000] rounded-xl border border-white/10 flex items-center justify-between">
                  <span className="text-white">$ codast</span>
                  <button
                    onClick={() => copyToClipboard('codast', 'gem2')}
                    className="p-1 rounded bg-[#161616] hover:bg-[#222222] text-[#888888] hover:text-white"
                  >
                    {copiedKey === 'gem2' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </>
            )}

            {activeMode === 'ollama' && (
              <>
                <div className="flex items-center justify-between text-xs text-[#666666] pb-2 border-b border-white/5 font-pixel">
                  <span>LOCAL OLLAMA SETUP (Zero internet &amp; zero keys)</span>
                  <span className="text-white">100% PRIVATE</span>
                </div>

                <div className="p-3.5 bg-[#000000] rounded-xl border border-white/10 flex items-center justify-between">
                  <span className="text-white">$ codast config set provider ollama</span>
                  <button
                    onClick={() => copyToClipboard('codast config set provider ollama', 'ol1')}
                    className="p-1 rounded bg-[#161616] hover:bg-[#222222] text-[#888888] hover:text-white"
                  >
                    {copiedKey === 'ol1' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="p-3.5 bg-[#000000] rounded-xl border border-white/10 flex items-center justify-between">
                  <span className="text-white">$ codast</span>
                  <button
                    onClick={() => copyToClipboard('codast', 'ol2')}
                    className="p-1 rounded bg-[#161616] hover:bg-[#222222] text-[#888888] hover:text-white"
                  >
                    {copiedKey === 'ol2' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </>
            )}

            {activeMode === 'voyage' && (
              <>
                <div className="flex items-center justify-between text-xs text-[#666666] pb-2 border-b border-white/5 font-pixel">
                  <span>VOYAGE AI HYBRID (SOTA code embeddings + Gemini chat)</span>
                  <span className="text-white">POWER USER</span>
                </div>

                <div className="p-3.5 bg-[#000000] rounded-xl border border-white/10 flex items-center justify-between">
                  <span className="text-white">$ codast config set voyage-key &lt;VOYAGE_KEY&gt;</span>
                  <button
                    onClick={() => copyToClipboard('codast config set voyage-key <VOYAGE_KEY>', 'voy1')}
                    className="p-1 rounded bg-[#161616] hover:bg-[#222222] text-[#888888] hover:text-white"
                  >
                    {copiedKey === 'voy1' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="p-3.5 bg-[#000000] rounded-xl border border-white/10 flex items-center justify-between">
                  <span className="text-white">$ codast config set api-key &lt;GEMINI_KEY&gt;</span>
                  <button
                    onClick={() => copyToClipboard('codast config set api-key <GEMINI_KEY>', 'voy2')}
                    className="p-1 rounded bg-[#161616] hover:bg-[#222222] text-[#888888] hover:text-white"
                  >
                    {copiedKey === 'voy2' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </>
            )}
          </div>

        </div>

      </div>
    </section>
  );
};
