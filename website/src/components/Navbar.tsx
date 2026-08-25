import React, { useState } from "react";
import { ExternalLink, Check } from "lucide-react";
import confetti from "canvas-confetti";

export const Navbar: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"cockpit" | "lab" | "config">(
    "cockpit",
  );

  const copyCommand = () => {
    navigator.clipboard.writeText("npm install -g @pra9v/codast");
    setCopied(true);
    confetti({
      particleCount: 35,
      spread: 55,
      origin: { y: 0.1 },
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full pt-4 pb-2 px-3 sm:px-8 pointer-events-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between font-mono text-xs gap-2">
        {/* Left Item: Floating Logo Capsule */}
        <div className="pointer-events-auto shrink-0">
          <a
            href="/"
            className="flex items-center justify-center"
            title="Codast"
          >
            <img
              src="/codast-logo.svg"
              alt="Codast Logo"
              className="w-5 h-5 sm:w-5.5 sm:h-5.5 object-contain"
            />
          </a>
        </div>

        {/* Center Item: Floating Segmented Mode Switcher */}
        <div className="pointer-events-auto flex items-center bg-black/80 p-1 rounded-full border border-white/20 text-[10px] sm:text-[11px] shadow-2xl backdrop-blur-md shrink-0">
          <a
            href="#cockpit"
            onClick={() => setActiveTab("cockpit")}
            className={`px-3 sm:px-4 py-1.5 rounded-full transition-all whitespace-nowrap ${
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
            className={`px-3 sm:px-4 py-1.5 rounded-full transition-all whitespace-nowrap ${
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
            className={`px-3 sm:px-4 py-1.5 rounded-full transition-all whitespace-nowrap ${
              activeTab === "config"
                ? "bg-white text-black font-semibold"
                : "text-[#888888] hover:text-white"
            }`}
          >
            Config
          </a>
        </div>

        {/* Right Item: Floating Solid White Get Button */}
        <div className="pointer-events-auto shrink-0">
          <button
            onClick={copyCommand}
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-white text-black font-semibold text-[10px] sm:text-xs hover:bg-[#EDEDED] transition-all active:scale-95 shadow-2xl whitespace-nowrap"
          >
            <span>{copied ? "Copied" : "Get it"}</span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-black" />
            ) : (
              <ExternalLink className="w-3 h-3 text-black" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
