'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useExerciseContext } from '@/state/ExerciseContext';
import { TRACKS, UNITS, getExercise } from '@/exercises/registry';

const STORAGE_KEY = '0xvrig-sidebar-v1';
const MOBILE_BREAKPOINT = '(max-width: 900px)';
const MOBILE_SIDEBAR_TOGGLE_EVENT = '0xvrig:toggle-mobile-sidebar';

interface SidebarState {
  collapsed: boolean;
  openTracks: Record<string, boolean>;
  openUnits: Record<string, boolean>;
}

function loadSidebarState(): SidebarState {
  if (typeof window === 'undefined') {
    return { collapsed: false, openTracks: {}, openUnits: {} };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* localStorage unavailable */ }
  return { collapsed: false, openTracks: {}, openUnits: {} };
}

function saveSidebarState(s: SidebarState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch { /* localStorage unavailable */ }
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useExerciseContext();

  const [sidebarState, setSidebarState] = useState<SidebarState>(() => loadSidebarState());
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Persist sidebar state on change
  useEffect(() => {
    saveSidebarState(sidebarState);
  }, [sidebarState]);

  const toggleCollapse = useCallback(() => {
    setSidebarState((prev) => ({ ...prev, collapsed: !prev.collapsed }));
  }, []);

  const toggleTrack = useCallback((trackId: string) => {
    setSidebarState((prev) => ({
      ...prev,
      openTracks: { ...prev.openTracks, [trackId]: !prev.openTracks[trackId] },
    }));
  }, []);

  const toggleUnit = useCallback((unitId: string) => {
    setSidebarState((prev) => ({
      ...prev,
      openUnits: { ...prev.openUnits, [unitId]: !prev.openUnits[unitId] },
    }));
  }, []);

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

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl+B: toggle sidebar
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        toggleCollapse();
      }
      // Ctrl+Enter: click first .primary button in #input-panel
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        const panel = document.getElementById('input-panel');
        if (panel) {
          const btn = panel.querySelector('button.primary') as HTMLButtonElement | null;
          if (btn) btn.click();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCollapse]);

  const { collapsed } = sidebarState;
  const isDesktopCollapsed = collapsed && !isMobile;

  // Determine which exercise is active from the URL path
  const exercisePrefix = '/exercise/';
  const idx = pathname?.indexOf(exercisePrefix) ?? -1;
  const activeExerciseId = idx >= 0
    ? pathname!.slice(idx + exercisePrefix.length)
    : state.currentExerciseId;

  // Find which track/unit the active exercise belongs to, so we can auto-open them
  useEffect(() => {
    if (!activeExerciseId) return;
    for (const track of TRACKS) {
      for (const unitId of track.unitIds) {
        const unit = UNITS.find((u) => u.id === unitId);
        if (unit && unit.exerciseIds.includes(activeExerciseId)) {
          setSidebarState((prev) => {
            const needsTrackOpen = !prev.openTracks[track.id];
            const needsUnitOpen = !prev.openUnits[unitId];
            if (!needsTrackOpen && !needsUnitOpen) return prev;
            return {
              ...prev,
              openTracks: { ...prev.openTracks, [track.id]: true },
              openUnits: { ...prev.openUnits, [unitId]: true },
            };
          });
          return;
        }
      }
    }
  }, [activeExerciseId]);

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

  const sidebarClasses = [
    'sidebar',
    isDesktopCollapsed ? 'sidebar-collapsed' : '',
    mobileOpen ? 'sidebar-mobile-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <button
        className={`mobile-sidebar-toggle${mobileOpen ? ' active' : ''}`}
        type="button"
        aria-controls="exercise-sidebar"
        aria-expanded={mobileOpen}
        aria-label={mobileOpen ? 'Close exercise navigation' : 'Open exercise navigation'}
        onClick={toggleMobileSidebar}
      >
        {mobileOpen ? 'Close' : 'Menu'}
      </button>

      {mobileOpen && (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Close exercise navigation"
          onClick={closeMobileSidebar}
        />
      )}

      <aside className={sidebarClasses} id="exercise-sidebar">
        <button
          className="sidebar-toggle"
          type="button"
          onClick={toggleCollapse}
          title={collapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
        >
          {collapsed ? '\u25B6' : '\u25C0'}
        </button>

        <button
          className="mobile-sidebar-close"
          type="button"
          aria-label="Close exercise navigation"
          onClick={closeMobileSidebar}
        >
          Done
        </button>

        {(isMobile || !collapsed) && (
          <div className="sidebar-content">
            {TRACKS.map((track) => {
              const trackUnits = track.unitIds
                .map((uid) => UNITS.find((u) => u.id === uid))
                .filter(Boolean) as typeof UNITS;
              const totalExercises = trackUnits.reduce((sum, u) => sum + u.exerciseIds.length, 0);
              const completedExercises = trackUnits.reduce(
                (sum, u) => sum + u.exerciseIds.filter((id) => state.completed.has(id)).length,
                0,
              );
              const isTrackOpen = !!sidebarState.openTracks[track.id];

              return (
                <div key={track.id} className="sidebar-track">
                  <button
                    className="sidebar-track-header"
                    type="button"
                    onClick={() => toggleTrack(track.id)}
                  >
                    <span className="sidebar-chevron">{isTrackOpen ? '\u25BE' : '\u25B8'}</span>
                    <span className="sidebar-track-name">{track.name}</span>
                    <span className="sidebar-track-count">
                      {completedExercises}/{totalExercises}
                    </span>
                  </button>

                  {isTrackOpen &&
                    trackUnits.map((unit) => {
                      const isUnitOpen = !!sidebarState.openUnits[unit.id];
                      const unitCompleted = unit.exerciseIds.filter((id) =>
                        state.completed.has(id),
                      ).length;

                      return (
                        <div key={unit.id} className="sidebar-unit">
                          <button
                            className="sidebar-unit-header"
                            type="button"
                            onClick={() => toggleUnit(unit.id)}
                          >
                            <span className="sidebar-chevron">
                              {isUnitOpen ? '\u25BE' : '\u25B8'}
                            </span>
                            <span className="sidebar-unit-name">{unit.name}</span>
                            <span className="sidebar-unit-count">
                              {unitCompleted}/{unit.exerciseIds.length}
                            </span>
                          </button>

                          {isUnitOpen &&
                            unit.exerciseIds.map((exId) => {
                              const ex = getExercise(exId);
                              if (!ex) return null;
                              const isActive = activeExerciseId === exId;
                              const isCompleted = state.completed.has(exId);
                              const displayTitle = ex.title.replace(/^\d+:\s*/, '');

                              return (
                                <button
                                  key={exId}
                                  className={`sidebar-exercise${isActive ? ' active' : ''}${isCompleted ? ' completed' : ''}`}
                                  type="button"
                                  onClick={() => router.push(`/exercise/${exId}`)}
                                  title={ex.title}
                                >
                                  <span className="sidebar-exercise-title">{displayTitle}</span>
                                  {isCompleted && (
                                    <span className="sidebar-exercise-check">{'\u2713'}</span>
                                  )}
                                </button>
                              );
                            })}
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        )}
      </aside>
    </>
  );
}
