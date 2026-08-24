import React from 'react';
import { Navbar } from './components/Navbar';
import { HeroCockpit } from './components/HeroCockpit';
import { BentoGrid } from './components/BentoGrid';
import { PolyglotLab } from './components/PolyglotLab';
import { SetupMatrix } from './components/SetupMatrix';
import { CommandMatrix } from './components/CommandMatrix';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050609] text-[#EEFFFF] selection:bg-[#82AAFF]/30 selection:text-[#89DDFF]">
      <Navbar />
      <main>
        <HeroCockpit />
        <BentoGrid />
        <PolyglotLab />
        <SetupMatrix />
        <CommandMatrix />
      </main>
      <Footer />
    </div>
  );
};

export default App;
