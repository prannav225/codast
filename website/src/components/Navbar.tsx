import React, { useState } from 'react';
import { ExternalLink, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Navbar: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'cockpit' | 'lab' | 'config'>('cockpit');

  const copyCommand = () => {
    navigator.clipboard.writeText('npm install -g @pra9v/codast');
    setCopied(true);
    confetti({
      particleCount: 35,
      spread: 55,
      origin: { y: 0.1 }
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-50 w-full py-3 sm:py-4 px-3 sm:px-8 bg-gradient-to-b from-black via-black/85 to-transparent backdrop-blur-[2px]">
      <div className="max-w-7xl mx-auto flex items-center justify-between font-mono text-xs gap-1.5 sm:gap-4">
        
        {/* Left Item: Floating Codast Logo */}
        <div className="shrink-0">
          <a
            href="#"
            className="flex items-center justify-center p-1.5 transition-all group"
            title="Codast"
          >
            <img
              src="/codast-logo.svg"
              alt="Codast Logo"
              className="w-5 h-5 sm:w-6 sm:h-6 object-contain group-hover:scale-110 transition-transform"
            />
          </a>
        </div>

        {/* Center Item: Floating Segmented Mode Switcher */}
        <div className="flex items-center bg-[#000000] p-0.5 sm:p-1 rounded-full border border-white/[0.2] text-[10px] sm:text-[11px] shadow-2xl backdrop-blur-md shrink-0">
          <a
            href="#cockpit"
            onClick={() => setActiveTab('cockpit')}
            className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full transition-all whitespace-nowrap ${
              activeTab === 'cockpit' ? 'bg-white text-black font-semibold' : 'text-[#888888] hover:text-white'
            }`}
          >
            Cockpit
          </a>
          <a
            href="#polyglot-lab"
            onClick={() => setActiveTab('lab')}
            className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full transition-all whitespace-nowrap ${
              activeTab === 'lab' ? 'bg-white text-black font-semibold' : 'text-[#888888] hover:text-white'
            }`}
          >
            <span className="inline sm:hidden">Lab</span>
            <span className="hidden sm:inline">AST Lab</span>
          </a>
          <a
            href="#setup"
            onClick={() => setActiveTab('config')}
            className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full transition-all whitespace-nowrap ${
              activeTab === 'config' ? 'bg-white text-black font-semibold' : 'text-[#888888] hover:text-white'
            }`}
          >
            Config
          </a>
        </div>

        {/* Right Item: Floating Solid White Get Button */}
        <div className="shrink-0">
          <button
            onClick={copyCommand}
            className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white text-black font-semibold text-[10px] sm:text-xs hover:bg-[#EDEDED] transition-all active:scale-95 shadow-lg whitespace-nowrap"
          >
            <span>{copied ? 'Copied' : 'Get it'}</span>
            {copied ? <Check className="w-3 h-3 text-black" /> : <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black" />}
          </button>
        </div>

      </div>
    </header>
  );
};
