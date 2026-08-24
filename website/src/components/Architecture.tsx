import React, { useState } from 'react';
import { Layers } from 'lucide-react';

export const Architecture: React.FC = () => {
  const [activeStage, setActiveStage] = useState<number>(0);

  const stages = [
    {
      id: 0,
      title: '1. Polyglot AST Engine',
      subtitle: 'Static Analysis & Symbol Extraction',
      color: '#FF5370',
      description: 'Parses source files into structured AST nodes detecting classes, methods, React hooks, interface definitions, and call chains across 10+ languages.',
      details: ['ts-morph AST analysis', 'Receiver methods & pub fn', 'Function call & import graph', 'Language-native docstrings']
    },
    {
      id: 1,
      title: '2. Structured SQLite Graph',
      subtitle: 'Relational Graph Persistence',
      color: '#FFCB6B',
      description: 'Indexes all entities into local SQLite tables: files, symbols, chunks, and relationships (IMPORTS, EXPORTS, DEFINES, CALLS, USES).',
      details: ['Sub-millisecond queries', 'Bidirectional graph traversal', 'Zero-cloud local database', 'Incremental delta updates']
    },
    {
      id: 2,
      title: '3. Neural Vector Store',
      subtitle: 'AST-Enriched Semantic Embedding',
      color: '#C3E88D',
      description: 'Logical chunker groups code by AST boundaries, prepends language-aware headers, and computes vector embeddings stored in LanceDB.',
      details: ['Voyage AI voyage-code-2', 'Gemini gemini-embedding-001', '100% Offline Ollama', 'LanceDB local storage']
    },
    {
      id: 3,
      title: '4. Hybrid Retrieval Ranker',
      subtitle: '4-Way Multi-Modal Fusion',
      color: '#89DDFF',
      description: 'Combines explicit @mention resolution, exact AST symbol search, cosine similarity vector retrieval, and 2-hop relational call graph expansion.',
      details: ['Mention Score: 100.0', 'AST Symbol Priority: 85.0', 'Graph Expansion: 60.0', 'Sliding Token Budgeting']
    },
    {
      id: 4,
      title: '5. Grounded AI Reasoning',
      subtitle: 'Evidence-Backed Synthesis',
      color: '#C792EA',
      description: 'Gemini 3.1 Flash Lite or local Ollama synthesizes the assembled context into concise markdown with exact line-range citations.',
      details: ['Zero hallucination guardrails', 'Inline file:line citations', 'Real-time response streaming', 'Multi-turn conversational context']
    }
  ];

  return (
    <section id="architecture" className="py-20 md:py-32 bg-[#0D1117] border-t border-[#1F2335]/60 relative scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#89DDFF]/10 text-xs font-mono text-[#89DDFF] border border-[#89DDFF]/30 mb-4">
            <Layers className="w-3.5 h-3.5" />
            UNDER THE HOOD
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#EEFFFF] tracking-tight mb-4">
            Hybrid Multi-Modal Pipeline.
          </h2>
          <p className="text-[#A6ACCD] text-base sm:text-lg leading-relaxed">
            Click through the 5 stages of the Codast pipeline to see how raw source code transforms into grounded intelligence.
          </p>
        </div>

        {/* Interactive Pipeline Steps */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-10 select-none">
          {stages.map((st, idx) => (
            <button
              key={st.id}
              onClick={() => setActiveStage(idx)}
              className={`p-3.5 rounded-xl border text-left font-mono transition-all relative overflow-hidden ${
                activeStage === idx
                  ? 'bg-[#161922] border-[#82AAFF] shadow-lg shadow-[#82AAFF]/10 scale-[1.02]'
                  : 'bg-[#090A0F]/60 border-[#1F2335] hover:border-[#3B4261] text-[#676E95]'
              }`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full mb-2"
                style={{ backgroundColor: st.color }}
              />
              <div className="text-xs font-bold text-[#EEFFFF] truncate">{st.title}</div>
              <div className="text-[10px] text-[#676E95] truncate">{st.subtitle}</div>
            </button>
          ))}
        </div>

        {/* Active Stage Deep-Dive Card */}
        <div className="p-6 sm:p-10 rounded-2xl bg-[#090A0F] border border-[#2E344A] shadow-2xl relative overflow-hidden">
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ backgroundColor: stages[activeStage].color }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#161922] border border-[#2E344A]" style={{ color: stages[activeStage].color }}>
                STAGE {activeStage + 1} OF 5
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#EEFFFF]">
                {stages[activeStage].title}: {stages[activeStage].subtitle}
              </h3>
              <p className="text-sm sm:text-base text-[#A6ACCD] leading-relaxed">
                {stages[activeStage].description}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-4">
                {stages[activeStage].details.map((d, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-mono text-[#EEFFFF]">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stages[activeStage].color }} />
                    <span>{d}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Stage Preview Box */}
            <div className="lg:col-span-5 p-5 rounded-xl bg-[#161922] border border-[#2E344A] font-mono text-xs text-[#EEFFFF] space-y-2">
              <div className="text-[10px] text-[#676E95] pb-2 border-b border-[#1F2335] flex justify-between">
                <span>STAGE ARTIFACT</span>
                <span style={{ color: stages[activeStage].color }}>JSON / SQL SCHEMA</span>
              </div>
              {activeStage === 0 && (
                <div className="text-[#A6ACCD] space-y-1">
                  <div className="text-[#89DDFF]">class AuthService &#123;</div>
                  <div className="pl-4 text-[#FFCB6B]">async login(creds: Credentials): Promise&lt;User&gt; &#123;</div>
                  <div className="pl-8 text-[#C3E88D]">this.db.query("SELECT * FROM users");</div>
                  <div className="pl-4 text-[#FFCB6B]">&#125;</div>
                  <div className="text-[#89DDFF]">&#125;</div>
                </div>
              )}
              {activeStage === 1 && (
                <div className="text-[#A6ACCD] space-y-1">
                  <div><span className="text-[#82AAFF]">RELATIONSHIP:</span> src/services/auth.ts</div>
                  <div><span className="text-[#C3E88D]">-[CALLS]-&gt;</span> db.query</div>
                  <div><span className="text-[#FFCB6B]">-[IMPORTS]-&gt;</span> User, Credentials</div>
                  <div><span className="text-[#C792EA]">-[EXPORTS]-&gt;</span> AuthService</div>
                </div>
              )}
              {activeStage === 2 && (
                <div className="text-[#A6ACCD] space-y-1">
                  <div className="text-[#89DDFF]">// File: src/services/auth.ts (Lines 14-64)</div>
                  <div className="text-[#FFCB6B]">// Symbol: AuthService.login (Method)</div>
                  <div className="text-[#676E95]">Vector [0.042, -0.198, 0.884, ...] (1536d)</div>
                </div>
              )}
              {activeStage === 3 && (
                <div className="text-[#A6ACCD] space-y-1">
                  <div>1. <span className="text-[#C3E88D]">@Mention Target</span> (Score: 100.0)</div>
                  <div>2. <span className="text-[#82AAFF]">AST Symbol Exact</span> (Score: 85.0)</div>
                  <div>3. <span className="text-[#C792EA]">2-Hop Call Graph</span> (Score: 60.0)</div>
                  <div>4. <span className="text-[#89DDFF]">Cosine Vector</span> (Score: 42.8)</div>
                </div>
              )}
              {activeStage === 4 && (
                <div className="text-[#A6ACCD] space-y-1">
                  <div className="text-[#C3E88D]">✔ Grounded Synthesis Complete</div>
                  <div className="text-[#EEFFFF]">↳ Evidence: auth.ts:14-64, user.ts:8-22</div>
                  <div className="text-[#82AAFF]">Latency: 0.38s • Tokens: 3,410</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
