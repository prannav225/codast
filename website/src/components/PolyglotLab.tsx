import React, { useState } from 'react';
import { Layers, Database } from 'lucide-react';

export const PolyglotLab: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState<'ts' | 'go' | 'rs' | 'py' | 'java' | 'sql'>('ts');

  const languages = [
    { id: 'ts', label: 'TypeScript', ext: 'auth.ts' },
    { id: 'go', label: 'Go', ext: 'service.go' },
    { id: 'rs', label: 'Rust', ext: 'session.rs' },
    { id: 'py', label: 'Python', ext: 'account.py' },
    { id: 'java', label: 'Java', ext: 'Payment.java' },
    { id: 'sql', label: 'SQL', ext: 'schema.sql' },
  ];

  const snippets = {
    ts: {
      code: `// src/services/auth.ts
export class AuthService {
  private db: Database;

  async login(creds: LoginCredentials): Promise<User> {
    const user = await this.db.users.find(creds.email);
    if (!user) throw new AuthError("User not found");
    return user;
  }
}`,
      symbols: [
        { type: 'CLASS', name: 'AuthService', lines: '2-10' },
        { type: 'METHOD', name: 'AuthService.login', lines: '5-9' },
      ],
      relations: [
        'AuthService.login -[CALLS]-> db.users.find',
        'src/services/auth.ts -[IMPORTS]-> Database, LoginCredentials, User'
      ]
    },
    go: {
      code: `// internal/auth/service.go
package auth

type TokenService interface {
    VerifyToken(token string) bool
}

func (s *AuthService) Login(email string) (*User, error) {
    return s.repo.FindByEmail(email)
}`,
      symbols: [
        { type: 'INTERFACE', name: 'TokenService', lines: '4-6' },
        { type: 'METHOD', name: '(*AuthService).Login', lines: '8-10' },
      ],
      relations: [
        'AuthService.Login -[CALLS]-> repo.FindByEmail',
        'package auth -[DEFINES]-> TokenService, AuthService'
      ]
    },
    rs: {
      code: `// src/session.rs
pub trait Authenticatable {
    fn verify(&self) -> bool;
}

impl Session {
    pub fn handle_request(&self, req: Request) -> Response {
        self.verify();
        Response::ok()
    }
}`,
      symbols: [
        { type: 'TRAIT', name: 'Authenticatable', lines: '2-4' },
        { type: 'METHOD', name: 'Session::handle_request', lines: '7-10' },
      ],
      relations: [
        'Session::handle_request -[CALLS]-> self.verify',
        'Session -[IMPLEMENTS]-> Authenticatable'
      ]
    },
    py: {
      code: `# app/services/account.py
class UserAccount:
    def __init__(self, username: str):
        self.username = username

    async def get_display_name(self) -> str:
        return f"User: {self.username}"`,
      symbols: [
        { type: 'CLASS', name: 'UserAccount', lines: '2-7' },
        { type: 'METHOD', name: 'UserAccount.__init__', lines: '3-4' },
        { type: 'ASYNC METHOD', name: 'UserAccount.get_display_name', lines: '6-7' }
      ],
      relations: [
        'app/services/account.py -[DEFINES]-> UserAccount'
      ]
    },
    java: {
      code: `// com/app/services/PaymentService.java
public class PaymentService {
    @Transactional
    public PaymentResult processPayment(Order order) {
        return gateway.charge(order.getTotal());
    }
}`,
      symbols: [
        { type: 'CLASS', name: 'PaymentService', lines: '2-7' },
        { type: 'METHOD', name: 'PaymentService.processPayment', lines: '3-6' }
      ],
      relations: [
        'PaymentService.processPayment -[CALLS]-> gateway.charge'
      ]
    },
    sql: {
      code: `-- migrations/001_users.sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);`,
      symbols: [
        { type: 'TABLE', name: 'users', lines: '2-6' },
        { type: 'PRIMARY KEY', name: 'id', lines: '3-3' }
      ],
      relations: [
        'schema -[DEFINES]-> users'
      ]
    }
  };

  return (
    <section id="polyglot-lab" className="py-16 sm:py-20 bg-[#000000] text-white border-b border-white/[0.1] font-mono scroll-mt-16 text-left">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Blueprint Container */}
        <div className="relative border border-white/[0.15] bg-[#000000] p-4 sm:p-8 lg:p-12 mb-12">
          
          {/* Corner Crosshairs */}
          <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 font-mono text-white text-base sm:text-lg select-none">+</div>
          <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 font-mono text-white text-base sm:text-lg select-none">+</div>
          <div className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 font-mono text-white text-base sm:text-lg select-none">+</div>
          <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 font-mono text-white text-base sm:text-lg select-none">+</div>

          {/* Section Header */}
          <div className="max-w-3xl mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#111111] text-[10px] sm:text-[11px] text-[#888888] border border-white/10 mb-3 sm:mb-4">
              <span>03 // POLYGLOT SUPPORT</span>
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-pixel tracking-tight text-white mb-3 sm:mb-4">
              Understands your stack.
            </h2>
            <p className="text-xs sm:text-sm lg:text-base text-[#888888] leading-relaxed">
              Whether you write TypeScript, Python, Go, Rust, Java, or SQL — Kodast parses real syntax trees and extracts functions, classes, and call relationships automatically.
            </p>
          </div>

          {/* Language Selector Pills (Horizontal Scroll on Mobile) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 sm:mb-8 no-scrollbar">
            {languages.map((l) => (
              <button
                key={l.id}
                onClick={() => setSelectedLang(l.id as any)}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs border transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 ${
                  selectedLang === l.id
                    ? 'bg-white text-black font-semibold border-white'
                    : 'bg-[#0A0A0A] text-[#888888] border-white/10 hover:border-white/30 hover:text-white'
                }`}
              >
                <span>{l.label}</span>
                <span className="text-[10px] opacity-60">({l.ext})</span>
              </button>
            ))}
          </div>

          {/* Split Screen Workbench with 1px Border Dividers */}
          <div className="grid grid-cols-1 lg:grid-cols-12 border border-white/[0.15] bg-[#0A0A0A] overflow-hidden">
            
            {/* Left: Code Editor Pane */}
            <div className="lg:col-span-7 p-4 sm:p-6 text-xs text-white border-b lg:border-b-0 lg:border-r border-white/[0.15] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4 text-[#888888]">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-xs">{languages.find(l => l.id === selectedLang)?.ext}</span>
                  </div>
                  <span className="text-[10px] font-pixel">SOURCE CODE</span>
                </div>
                <pre className="text-[#EDEDED] leading-relaxed overflow-x-auto whitespace-pre font-mono text-[11px] sm:text-xs">
                  <code>{snippets[selectedLang].code}</code>
                </pre>
              </div>

              <div className="pt-4 border-t border-white/[0.08] mt-6 text-[10px] sm:text-[11px] text-[#666666] flex justify-between">
                <span>Parser: Polyglot Trees</span>
                <span className="text-white">✔ Validated</span>
              </div>
            </div>

            {/* Right: AST & Graph Inspector */}
            <div className="lg:col-span-5 p-4 sm:p-6 text-xs bg-[#000000] space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] text-white">
                  <span className="font-bold flex items-center gap-2 text-xs font-pixel">
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    <span>Extracted AST Nodes</span>
                  </span>
                  <span className="text-[10px] text-[#666666]">SQLite Schema</span>
                </div>

                {/* Symbols */}
                <div className="mt-4 space-y-2">
                  {snippets[selectedLang].symbols.map((sym, idx) => (
                    <div key={idx} className="p-2 sm:p-2.5 rounded bg-[#0A0A0A] border border-white/10 flex items-center justify-between gap-2">
                      <div className="truncate min-w-0">
                        <span className="text-[9px] sm:text-[10px] font-pixel text-black bg-white px-1.5 py-0.5 rounded mr-2 shrink-0">
                          {sym.type}
                        </span>
                        <span className="text-white font-semibold truncate text-[11px] sm:text-xs">{sym.name}</span>
                      </div>
                      <span className="text-[10px] text-[#666666] shrink-0">L{sym.lines}</span>
                    </div>
                  ))}
                </div>

                {/* Relationships */}
                <div className="mt-4 pt-3 border-t border-white/[0.08]">
                  <div className="text-[11px] font-bold text-white mb-2 flex items-center gap-1.5 font-pixel">
                    <Database className="w-3.5 h-3.5 shrink-0" />
                    <span>Relational Graph Edges:</span>
                  </div>
                  <div className="space-y-1 text-[10px] sm:text-[11px] text-[#888888]">
                    {snippets[selectedLang].relations.map((rel, idx) => (
                      <div key={idx} className="p-2 rounded bg-[#0A0A0A] border border-white/5 break-words">
                        {rel}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-white bg-white/5 p-2.5 sm:p-3 rounded border border-white/10 mt-4">
                ⚡ Partitioned into logical AST chunks with language-aware comment headers
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
