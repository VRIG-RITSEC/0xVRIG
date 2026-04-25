'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useExerciseContext } from '@/state/ExerciseContext';

const MOBILE_BREAKPOINT = '(max-width: 900px)';
const MOBILE_SIDEBAR_TOGGLE_EVENT = '0xvrig:toggle-mobile-sidebar';

const IMAGINE_RIT_EXERCISES = [
  { id: 'rit-01', title: 'The Stack Frame' },
  { id: 'rit-02', title: 'The Overflow' },
  { id: 'rit-03', title: 'Hijack Execution' },
  { id: 'rit-04', title: 'Randomized Addresses' },
  { id: 'rit-rop', title: "Baby's First ROP" },
];

export default function ImagineRitSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useExerciseContext();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeId = pathname?.split('/imagine-rit/')[1] ?? '';

  const toggleMobileSidebar = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setMobileOpen(false);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT);
    const syncIsMobile = (event?: MediaQueryListEvent) => {
      const matches = event?.matches ?? mediaQuery.matches;
      setIsMobile(matches);
      if (!matches) {
        setMobileOpen(false);
      }
    };

    syncIsMobile();
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncIsMobile);
      return () => mediaQuery.removeEventListener('change', syncIsMobile);
    }

    mediaQuery.addListener(syncIsMobile);
    return () => mediaQuery.removeListener(syncIsMobile);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [isMobile, pathname]);

  useEffect(() => {
    function handleExternalToggle() {
      setMobileOpen((prev) => !prev);
    }

    window.addEventListener(MOBILE_SIDEBAR_TOGGLE_EVENT, handleExternalToggle);
    return () => window.removeEventListener(MOBILE_SIDEBAR_TOGGLE_EVENT, handleExternalToggle);
  }, []);

  return (
    <>
      <button
        className={`mobile-sidebar-toggle${mobileOpen ? ' active' : ''}`}
        type="button"
        aria-controls="imagine-rit-sidebar"
        aria-expanded={mobileOpen}
        aria-label={mobileOpen ? 'Close Imagine RIT navigation' : 'Open Imagine RIT navigation'}
        onClick={toggleMobileSidebar}
      >
        {mobileOpen ? 'Close' : 'Menu'}
      </button>

      {mobileOpen && (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Close Imagine RIT navigation"
          onClick={closeMobileSidebar}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'sidebar-mobile-open' : ''}`} id="imagine-rit-sidebar">
        <button
          className="mobile-sidebar-close"
          type="button"
          aria-label="Close Imagine RIT navigation"
          onClick={closeMobileSidebar}
        >
          Done
        </button>

        <div className="sidebar-content">
          <div className="sidebar-track">
            <div className="sidebar-track-header" style={{ cursor: 'default' }}>
              <span className="sidebar-track-name">Imagine RIT</span>
              <span className="sidebar-track-count">
                {IMAGINE_RIT_EXERCISES.filter(ex => state.completed.has(ex.id)).length}/{IMAGINE_RIT_EXERCISES.length}
              </span>
            </div>

            {IMAGINE_RIT_EXERCISES.map((ex, i) => {
              const isActive = activeId === ex.id;
              const isCompleted = state.completed.has(ex.id);

              return (
                <button
                  key={ex.id}
                  className={`sidebar-exercise${isActive ? ' active' : ''}${isCompleted ? ' completed' : ''}`}
                  type="button"
                  onClick={() => router.push(`/imagine-rit/${ex.id}`)}
                  title={ex.title}
                >
                  <span className="sidebar-exercise-title">
                    {String(i + 1).padStart(2, '0')}. {ex.title}
                  </span>
                  {isCompleted && (
                    <span className="sidebar-exercise-check">{'✓'}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}
