'use client';

import Link from 'next/link';
import { ExerciseContextProvider } from '@/state/ExerciseContext';
import ImagineRitSidebar from '@/components/AppShell/ImagineRitSidebar';
import SuccessBanner from '@/components/shared/SuccessBanner';
import ToastMessage from '@/components/shared/ToastMessage';
import SolutionGuideModal from '@/components/shared/SolutionGuideModal';

export default function ImagineRitLayout({ children }: { children: React.ReactNode }) {
  return (
    <ExerciseContextProvider>
      <div id="app">
        <header>
          <h1><Link href="/imagine-rit" style={{ color: 'inherit', textDecoration: 'none' }}>0xVRIG</Link></h1>
          <div id="badges"></div>
        </header>
        <div id="app-body">
          <ImagineRitSidebar />
          <main>
            {children}
          </main>
        </div>
        <SuccessBanner />
        <SolutionGuideModal />
        <ToastMessage />
      </div>
    </ExerciseContextProvider>
  );
}
