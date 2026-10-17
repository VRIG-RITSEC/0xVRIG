'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DemoDraft, DemoId, initialDraft, newAddressOffset } from '@/demo/challenges';
import { createDemoProgress, DemoProgress, readDemoProgress, writeDemoProgress } from '@/demo/persistence';
import styles from './Demo.module.css';

interface DemoContextValue {
  progress: DemoProgress;
  ready: boolean;
  storageAvailable: boolean;
  updateDraft: (id: DemoId, changes: Partial<DemoDraft>, completed?: boolean) => void;
  visit: (id: DemoId) => void;
  replay: (id: DemoId) => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error('Demo components need DemoShell');
  return value;
}

export default function DemoShell({ children }: { children: React.ReactNode }) {
  const isSlideshow = usePathname()?.endsWith('/slideshow') ?? false;
  const [progress, setProgress] = useState(() => createDemoProgress(0x1000));
  const [ready, setReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);

  useEffect(() => {
    const previousEra = document.body.getAttribute('data-era');
    document.body.classList.add('demo-page');
    document.body.setAttribute('data-era', 'win95');
    return () => {
      document.body.classList.remove('demo-page');
      if (previousEra) document.body.setAttribute('data-era', previousEra);
      else document.body.removeAttribute('data-era');
    };
  }, []);

  useEffect(() => {
    if (isSlideshow) return;
    let restored: DemoProgress | null = null;
    try {
      restored = readDemoProgress(window.localStorage);
    } catch {
      setStorageAvailable(false);
    }
    setProgress(restored ?? createDemoProgress(newAddressOffset()));
    setReady(true);
  }, [isSlideshow]);

  useEffect(() => {
    if (!ready || isSlideshow) return;
    try {
      setStorageAvailable(writeDemoProgress(window.localStorage, progress));
    } catch {
      setStorageAvailable(false);
    }
  }, [ready, progress, isSlideshow]);

  const updateDraft = useCallback((id: DemoId, changes: Partial<DemoDraft>, completed = false) => {
    setProgress(previous => ({
      ...previous,
      current: id,
      drafts: { ...previous.drafts, [id]: { ...previous.drafts[id], ...changes } },
      completed: completed && !previous.completed.includes(id) ? [...previous.completed, id] : previous.completed,
    }));
  }, []);

  const visit = useCallback((id: DemoId) => {
    setProgress(previous => previous.current === id ? previous : { ...previous, current: id });
  }, []);

  const replay = useCallback((id: DemoId) => {
    setProgress(previous => ({
      ...previous,
      current: id,
      offset: id === 'addresses' ? newAddressOffset() : previous.offset,
      drafts: { ...previous.drafts, [id]: initialDraft(id) },
    }));
  }, []);

  return (
    <DemoContext.Provider value={{ progress, ready, storageAvailable, updateDraft, visit, replay }}>
      <div className={styles.shell} data-era="win95">
        <a className={styles.skipLink} href="#demo-content">Skip to challenge</a>
        <header className={styles.header}>
          <Link href="/" className={styles.wordmark} aria-label="0xVRIG home">0xVRIG</Link>
          <nav className={styles.headerLinks} aria-label="Demo navigation">
            <Link href={isSlideshow ? '/demo' : '/demo/slideshow'}>{isSlideshow ? 'Try it yourself' : 'Watch the demo'}</Link>
            <Link href="/imagine-rit">Full workshop</Link>
          </nav>
        </header>
        {children}
        <footer className={styles.footer}>
          <span>Made by <a href="https://vri.group/">VRIG</a> · <a href="https://ritsec.club/">RITSEC</a></span>
        </footer>
      </div>
    </DemoContext.Provider>
  );
}
