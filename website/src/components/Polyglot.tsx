import React, { useState } from 'react';
import { Code2, CheckCircle2 } from 'lucide-react';

export const Polyglot: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState<'ts' | 'py' | 'go' | 'rs' | 'java' | 'sql'>('ts');

  const languages = [
    { id: 'ts', label: 'TypeScript', ext: '.ts / .tsx', color: '#3178C6' },
    { id: 'py', label: 'Python', ext: '.py', color: '#3776AB' },
    { id: 'go', label: 'Go', ext: '.go', color: '#00ADD8' },
    { id: 'rs', label: 'Rust', ext: '.rs', color: '#DEA584' },
    { id: 'java', label: 'Java', ext: '.java', color: '#B07219' },
    { id: 'sql', label: 'SQL / DB', ext: '.sql', color: '#E38C00' },
  ];

  const snippets = {
    ts: {
      code: `export class AuthService {
  async login(creds: LoginCredentials): Promise<User> {
    const user = await this.db.users.find(creds.email);
    return user;
  }
}`,
      extracted: ['Class: AuthService (Lines 1-6)', 'Method: AuthService.login (Lines 2-5)', 'Relation: -[CALLS]-> db.users.find']
    },
    py: {
      code: `class UserAccount:
    def __init__(self, username: str):
        self.username = username

    async def get_display_name(self) -> str:
        return f"User: {self.username}"`,
      extracted: ['Class: UserAccount (Lines 1-6)', 'Method: UserAccount.__init__', 'Async Method: UserAccount.get_display_name']
    },
    go: {
      code: `type TokenService interface {
    VerifyToken(token string) bool
}

func (s *AuthService) Login(email string) (*User, error) {
    return s.repo.FindByEmail(email)
}`,
      extracted: ['Interface: TokenService (Lines 1-3)', 'Receiver Method: (*AuthService).Login', 'Relation: -[CALLS]-> repo.FindByEmail']
    },
    rs: {
      code: `pub trait Authenticatable {
    fn verify(&self) -> bool;
}

impl Session {
    pub fn handle_request(&self, req: Request) -> Response {
        self.verify();
    }
}`,
      extracted: ['Trait: Authenticatable', 'Impl Block: Session', 'Method: Session.handle_request', 'Relation: -[CALLS]-> self.verify']
    },
    java: {
      code: `public class PaymentService {
    @Transactional
    public PaymentResult processPayment(Order order) {
        return gateway.charge(order.getTotal());
    }
}`,
      extracted: ['Class: PaymentService', 'Method: processPayment (Annotated: @Transactional)', 'Relation: -[CALLS]-> gateway.charge']
    },
    sql: {
      code: `CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);`,
      extracted: ['Table: users (Primary Key: id)', 'Unique Index: email', 'Schema Definition Chunk: users']
    }
  };

  return (
    <section id="polyglot" className="py-20 md:py-32 bg-[#090A0F] border-t border-[#1F2335]/60 relative scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C3E88D]/10 text-xs font-mono text-[#C3E88D] border border-[#C3E88D]/30 mb-4">
            <Code2 className="w-3.5 h-3.5" />
            UNIVERSAL POLYGLOT
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#EEFFFF] tracking-tight mb-4">
            Native Support for Your Entire Stack.
          </h2>
          <p className="text-[#A6ACCD] text-base sm:text-lg leading-relaxed">
            Codast extracts deep AST semantics, receiver methods, annotations, and relationships across any modern programming language.
          </p>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mb-8">
          {languages.map((l) => (
            <button
              key={l.id}
              onClick={() => setSelectedLang(l.id as any)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-mono border transition-all flex items-center gap-2 ${
                selectedLang === l.id
                  ? 'bg-[#161922] text-[#EEFFFF] border-[#82AAFF] shadow-lg shadow-[#82AAFF]/15'
                  : 'bg-[#0D1117] text-[#676E95] border-[#1F2335] hover:border-[#3B4261]'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="font-semibold">{l.label}</span>
              <span className="text-[10px] text-[#4F5676] hidden sm:inline">{l.ext}</span>
            </button>
          ))}
        </div>

        {/* Code & Extracted AST Symbols Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl mx-auto">
          {/* Code Window */}
          <div className="lg:col-span-7 rounded-2xl bg-[#0D1117] border border-[#2E344A] p-5 font-mono text-xs text-[#EEFFFF] shadow-2xl overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#1F2335] mb-4 text-[#676E95]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5370]/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFCB6B]/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#C3E88D]/80" />
                  <span className="text-[11px] text-[#89DDFF] ml-2">example{languages.find(l => l.id === selectedLang)?.ext.split(' ')[0]}</span>
                </div>
                <span className="text-[10px]">Source Input</span>
              </div>
              <pre className="text-[#A6ACCD] leading-relaxed overflow-x-auto whitespace-pre">
                <code>{snippets[selectedLang].code}</code>
              </pre>
            </div>
            <div className="text-[10px] text-[#676E95] pt-4 border-t border-[#1F2335] mt-4 flex items-center justify-between">
              <span>AST-Aware Parser</span>
              <span className="text-[#C3E88D]">Syntax OK</span>
            </div>
          </div>

          {/* Extracted AST Intelligence Panel */}
          <div className="lg:col-span-5 rounded-2xl bg-[#161922] border border-[#2E344A] p-5 font-mono text-xs text-[#EEFFFF] shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#1F2335] mb-4 text-[#82AAFF]">
                <span className="font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C3E88D]" />
                  Extracted AST Nodes
                </span>
                <span className="text-[10px] text-[#676E95]">SQLite Indexed</span>
              </div>
              <div className="space-y-3">
                {snippets[selectedLang].extracted.map((e, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-[#0D1117] border border-[#1F2335] text-xs">
                    <div className="text-[#C3E88D] font-semibold">{e}</div>
                    <div className="text-[10px] text-[#676E95] mt-1">Chunk Partitioned • Vector Embed Prepared</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-[#89DDFF] bg-[#89DDFF]/10 p-2.5 rounded-lg border border-[#89DDFF]/20 mt-4">
              ✨ Instant sub-second parsing across all files in repository
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
