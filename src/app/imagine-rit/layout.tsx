'use client';

import { ExerciseContextProvider } from '@/state/ExerciseContext';
import ImagineRitSidebar from '@/components/AppShell/ImagineRitSidebar';
import SuccessBanner from '@/components/shared/SuccessBanner';

export default function ImagineRitLayout({ children }: { children: React.ReactNode }) {
  return (
    <ExerciseContextProvider>
      <div id="app">
        <header>
          <h1>0xVRIG</h1>
          <div id="badges"></div>
        </header>
        <div id="app-body">
          <ImagineRitSidebar />
          <main>
            {children}
          </main>
        </div>
        <SuccessBanner />
      </div>
    </ExerciseContextProvider>
  );
}
