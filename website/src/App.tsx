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
    <div className="min-h-screen bg-[#000000] text-white selection:bg-white selection:text-black overflow-x-hidden">
      <Navbar />
      <main className="overflow-x-hidden">
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
