'use client';

import Link from 'next/link';
import { ExerciseContextProvider } from '@/state/ExerciseContext';
import Sidebar from '@/components/AppShell/Sidebar';
import SuccessBanner from '@/components/shared/SuccessBanner';
import BadgePopup from '@/components/shared/BadgePopup';
import ToastMessage from '@/components/shared/ToastMessage';
import SolutionGuideModal from '@/components/shared/SolutionGuideModal';

export default function ExerciseLayout({ children }: { children: React.ReactNode }) {
  return (
    <ExerciseContextProvider>
      <div id="app">
        <header>
          <h1><Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>0xVRIG</Link></h1>
          <div id="badges"></div>
        </header>
        <div id="app-body">
          <Sidebar />
          <main>
            {children}
          </main>
        </div>
        <SuccessBanner />
        <SolutionGuideModal />
        <ToastMessage />
        <BadgePopup />
      </div>
    </ExerciseContextProvider>
  );
}
