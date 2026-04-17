'use client';

import { ExerciseContextProvider } from '@/state/ExerciseContext';
import ExerciseNav from '@/components/AppShell/ExerciseNav';
import SuccessBanner from '@/components/shared/SuccessBanner';

export default function ExerciseLayout({ children }: { children: React.ReactNode }) {
  return (
    <ExerciseContextProvider>
      <div id="app">
        <header>
          <h1>// MEMORY CORRUPTION LAB</h1>
          <ExerciseNav />
          <div id="badges"></div>
        </header>
        <main>
          {children}
        </main>
        <SuccessBanner />
      </div>
    </ExerciseContextProvider>
  );
}
