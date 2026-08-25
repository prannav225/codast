import React from 'react';
import { ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#000000] border-t border-white/[0.15] py-10 sm:py-16 font-mono text-xs text-[#666666]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 sm:pb-8 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <img
              src="/codast-logo.svg"
              alt="Kodast Logo"
              className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
            />
            <div className="text-left">
              <span className="text-white font-bold font-pixel text-sm">
                <span className="inline-block scale-x-[-1] origin-center mr-[0.02em]">K</span>ODAST
              </span>
              <div className="text-[10px] text-[#555555]">Local Code Intelligence &amp; Neural AST</div>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 text-[#888888] flex-wrap justify-center text-xs">
            <a href="#cockpit" className="hover:text-white transition-colors">Cockpit</a>
            <a href="#bento" className="hover:text-white transition-colors">Superpowers</a>
            <a href="#polyglot-lab" className="hover:text-white transition-colors">AST Lab</a>
            <a href="#setup" className="hover:text-white transition-colors">Setup</a>
            <a href="https://github.com/prannav225/codast" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
              GitHub <ExternalLink className="w-3 h-3" />
            </a>
            <a href="https://www.npmjs.com/package/@pra9v/kodast" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
              NPM <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="pt-6 sm:pt-8 text-center sm:text-left text-[11px] text-[#555555]">
          © 2026 <a href="https://github.com/prannav225" className="text-white hover:underline">Pranav</a>
        </div>
      </div>
    </footer>
  );
};
