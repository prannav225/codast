import React, { useState } from "react";
import { ExternalLink, Check, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface NavbarProps {
  onOpenPoster?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenPoster }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"cockpit" | "lab" | "config">(
    "cockpit",
  );

  const copyCommand = () => {
    navigator.clipboard.writeText("npm install -g @pra9v/kodast");
    setCopied(true);
    confetti({
      particleCount: 35,
      spread: 55,
      origin: { y: 0.1 },
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full pt-3 sm:pt-4 pb-2 px-3 sm:px-8 pointer-events-none">
      <div className="relative max-w-7xl mx-auto flex items-center justify-between font-mono text-xs">
        
        {/* Left Item: Floating Logo Capsule */}
        <div className="pointer-events-auto shrink-0 flex items-center">
          <a
            href="/"
            className="flex items-center justify-center p-1.5 sm:p-2 rounded-full bg-black/80 border border-white/20 backdrop-blur-md shadow-2xl"
            title="Kodast"
          >
            <img
              src="/codast-logo.svg"
              alt="Kodast Logo"
              className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 object-contain"
            />
          </a>
        </div>

        {/* Center Item: Mathematically Centered Floating Segmented Mode Switcher */}
        <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2 flex items-center bg-black/80 p-0.5 sm:p-1 rounded-full border border-white/20 text-[9.5px] sm:text-[11px] shadow-2xl backdrop-blur-md shrink-0">
          <a
            href="#cockpit"
            onClick={() => setActiveTab("cockpit")}
            className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full transition-all whitespace-nowrap ${
              activeTab === "cockpit"
                ? "bg-white text-black font-semibold"
                : "text-[#888888] hover:text-white"
            }`}
          >
            Cockpit
          </a>
          <a
            href="#polyglot-lab"
            onClick={() => setActiveTab("lab")}
            className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full transition-all whitespace-nowrap ${
              activeTab === "lab"
                ? "bg-white text-black font-semibold"
                : "text-[#888888] hover:text-white"
            }`}
          >
            <span className="inline sm:hidden">Lab</span>
            <span className="hidden sm:inline">AST Lab</span>
          </a>
          <a
            href="#setup"
            onClick={() => setActiveTab("config")}
            className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full transition-all whitespace-nowrap ${
              activeTab === "config"
                ? "bg-white text-black font-semibold"
                : "text-[#888888] hover:text-white"
            }`}
          >
            Config
          </a>
        </div>

        {/* Right Items: Floating Action Buttons */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onOpenPoster && (
            <button
              onClick={onOpenPoster}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#111111] hover:bg-[#222222] text-[#EDEDED] border border-white/20 text-[10px] sm:text-xs transition-all active:scale-95 shadow-2xl cursor-pointer"
              title="Download 9:16 Launch Poster for Instagram & LinkedIn"
            >
              <Sparkles className="w-3 h-3 text-[#82AAFF]" />
              <span>Poster (9:16)</span>
            </button>
          )}

          <button
            onClick={copyCommand}
            className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white text-black font-semibold text-[10px] sm:text-xs hover:bg-[#EDEDED] transition-all active:scale-95 shadow-2xl whitespace-nowrap cursor-pointer"
          >
            <span>{copied ? "Copied" : "Get it"}</span>
            {copied ? (
              <Check className="w-3 h-3 text-black" />
            ) : (
              <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black" />
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
