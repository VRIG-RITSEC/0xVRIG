'use client';

import { use, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useExerciseContext } from '@/state/ExerciseContext';
import { getExercise, getAllExercises } from '@/exercises/registry';
import { imagineRitExercises } from '@/exercises/imagine-rit';
import { StackSim } from '@/engine/simulators/StackSim';
import { HeapSim } from '@/engine/simulators/HeapSim';
import { WinHeapSim } from '@/engine/simulators/WinHeapSim';
import { X86Emulator } from '@/engine/x86/emulator';
import { ArmEmulator } from '@/engine/arm/emulator';
import { MipsEmulator } from '@/engine/mips/emulator';
import { BASE_SYMBOLS } from '@/exercises/shared/symbols';
import SourcePanel from '@/components/panels/SourcePanel/SourcePanel';
import VizPanel from '@/components/panels/VizPanel/VizPanel';
import InputPanel from '@/components/panels/InputPanel/InputPanel';
import Toolkit from '@/components/panels/InputPanel/Toolkit';
import LogPanel from '@/components/panels/LogPanel/LogPanel';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const MOBILE_BREAKPOINT = '(max-width: 900px)';
const MOBILE_SIDEBAR_TOGGLE_EVENT = '0xvrig:toggle-mobile-sidebar';

function retAddrInMain(symbols: Record<string, number>): number {
  return (symbols.main || BASE_SYMBOLS.main) + 0x25;
}

const CODE_SYMBOLS = ['main', 'win', 'vuln', 'normal'];
const LIBC_SYMBOLS = ['system', 'binsh'];
const STACK_SYMBOLS = ['main_ret'];

function computeSymbols(exercise: ReturnType<typeof getExercise>): Record<string, number> {
  const symbols = { ...BASE_SYMBOLS };

  if (exercise?.aslr) {
    const codeOffset = ((Math.random() * 0x200000) >>> 0) & ~0xfff;
    const libcOffset = ((Math.random() * 0x10000000) >>> 0) & ~0xfff;
    const stackOffset = ((Math.random() * 0x800000) >>> 0) & ~0xfff;

    for (const key of Object.keys(symbols)) {
      if (CODE_SYMBOLS.includes(key)) {
        symbols[key] = (symbols[key] + codeOffset) >>> 0;
      } else if (LIBC_SYMBOLS.includes(key)) {
        symbols[key] = (symbols[key] + libcOffset) >>> 0;
      } else if (STACK_SYMBOLS.includes(key)) {
        symbols[key] = (symbols[key] + stackOffset) >>> 0;
      } else {
        symbols[key] = (symbols[key] + codeOffset) >>> 0;
      }
    }
  }

  if (exercise?.srop) {
    symbols['sigreturn'] = 0x080481b0;
    if (exercise.aslr) {
      const offset = symbols['main'] - BASE_SYMBOLS.main;
      symbols['sigreturn'] = (0x080481b0 + offset) >>> 0;
    }
  }

  return symbols;
}

function ExerciseDirectionsPanel() {
  const { currentExercise } = useExerciseContext();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`panel mobile-directions-panel${collapsed ? ' is-collapsed' : ''}`}>
      <div className="panel-hdr mobile-directions-header">
        <span>directions</span>
        <button
          type="button"
          className="mobile-directions-toggle"
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((prev) => !prev)}
        >
          {collapsed ? 'Expand' : 'Minimize'}
        </button>
      </div>
      {!collapsed && (
        <div className="panel-body">
          {currentExercise ? (
            <div
              className="mobile-directions-content"
              dangerouslySetInnerHTML={{ __html: currentExercise.desc }}
            />
          ) : (
            <div className="mobile-directions-empty">Select an exercise to begin.</div>
          )}
        </div>
      )}
    </div>
  );
}

function MobileExercisePager() {
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useExerciseContext();
  const currentId = state.currentExerciseId;
  const isImagineRit = pathname?.startsWith('/imagine-rit/');
  const orderedExercises = isImagineRit ? imagineRitExercises : getAllExercises();
  const currentIndex = orderedExercises.findIndex((exercise) => exercise.id === currentId);
  const prevExercise = currentIndex > 0 ? orderedExercises[currentIndex - 1] : null;
  const nextExercise =
    currentIndex >= 0 && currentIndex < orderedExercises.length - 1
      ? orderedExercises[currentIndex + 1]
      : null;
  const basePath = isImagineRit ? '/imagine-rit' : '/exercise';
  const nextHref = nextExercise
    ? `${basePath}/${nextExercise.id}`
    : isImagineRit && currentId === 'rit-rop'
      ? '/imagine-rit/congratulations'
      : null;

  return (
    <div className="mobile-exercise-pager">
      <button
        type="button"
        className="link-button secondary"
        disabled={!prevExercise}
        onClick={() => prevExercise && router.push(`${basePath}/${prevExercise.id}`)}
      >
        ← Previous
      </button>
      <button
        type="button"
        className="link-button secondary-accent"
        onClick={() => window.dispatchEvent(new Event(MOBILE_SIDEBAR_TOGGLE_EVENT))}
      >
        Contents
      </button>
      <button
        type="button"
        className="link-button primary"
        disabled={!nextHref}
        onClick={() => nextHref && router.push(nextHref)}
      >
        {nextExercise ? 'Next →' : isImagineRit && currentId === 'rit-rop' ? 'Finish →' : 'Next →'}
      </button>
    </div>
  );
}

export default function ExercisePageClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { dispatch, stackSim, heapSim, asmEmulator, currentExercise } = useExerciseContext();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'source' | 'viz' | 'log' | 'misc'>('source');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT);
    const syncIsMobile = (event?: MediaQueryListEvent) => {
      setIsMobile(event?.matches ?? mediaQuery.matches);
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
    if (typeof window === 'undefined') return;

    const htmlElement = document.documentElement;

    if (!isMobile) {
      htmlElement.style.removeProperty('--mobile-visual-viewport-height');
      return;
    }

    const syncViewportHeight = () => {
      const viewportHeight = Math.round(window.visualViewport?.height ?? window.innerHeight);
      htmlElement.style.setProperty('--mobile-visual-viewport-height', `${viewportHeight}px`);
    };

    syncViewportHeight();

    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', syncViewportHeight);
    viewport?.addEventListener('scroll', syncViewportHeight);
    window.addEventListener('resize', syncViewportHeight);
    window.addEventListener('orientationchange', syncViewportHeight);

    return () => {
      viewport?.removeEventListener('resize', syncViewportHeight);
      viewport?.removeEventListener('scroll', syncViewportHeight);
      window.removeEventListener('resize', syncViewportHeight);
      window.removeEventListener('orientationchange', syncViewportHeight);
      htmlElement.style.removeProperty('--mobile-visual-viewport-height');
    };
  }, [isMobile]);

  useEffect(() => {
    setActiveMobileTab('source');
  }, [id]);

  useEffect(() => {
    const mainElement = document.querySelector('#app-body > main');
    const appElement = document.getElementById('app');
    const bodyElement = document.body;
    const htmlElement = document.documentElement;
    if (!mainElement) return;

    if (isMobile) {
      mainElement.classList.add('exercise-main-mobile-shell');
      appElement?.classList.add('exercise-mobile-nav-bottom');
      bodyElement.classList.add('exercise-mobile-scroll-lock');
      htmlElement.classList.add('exercise-mobile-scroll-lock');
    } else {
      mainElement.classList.remove('exercise-main-mobile-shell');
      appElement?.classList.remove('exercise-mobile-nav-bottom');
      bodyElement.classList.remove('exercise-mobile-scroll-lock');
      htmlElement.classList.remove('exercise-mobile-scroll-lock');
    }

    return () => {
      mainElement.classList.remove('exercise-main-mobile-shell');
      appElement?.classList.remove('exercise-mobile-nav-bottom');
      bodyElement.classList.remove('exercise-mobile-scroll-lock');
      htmlElement.classList.remove('exercise-mobile-scroll-lock');
    };
  }, [isMobile, pathname]);

  useEffect(() => {
    const exercise = getExercise(id);
    if (!exercise) return;

    const symbols = computeSymbols(exercise);
    dispatch({ type: 'SET_SYMBOLS', symbols });

    const vizMode = exercise.vizMode;
    const needsStack = vizMode === 'stack' || vizMode === 'both';
    const needsHeap = vizMode === 'heap' || vizMode === 'both';

    // Initialize StackSim
    if (needsStack || exercise.mode.startsWith('input-')) {
      let extraSize = 0;
      if (exercise.ret2libc) extraSize = 8;
      else if (exercise.rop) extraSize = 40;
      else if (exercise.srop) extraSize = 28;
      else if (exercise.pivot) extraSize = 40;

      const sim = new StackSim({
        bufSize: exercise.bufSize ?? 16,
        retAddr: retAddrInMain(symbols),
        savedEbp: 0xbfff0200,
        useCanary: exercise.canary,
        extraSize,
      });

      if (exercise.mode === 'step') {
        sim.clearBlank();
      }

      stackSim.current = sim;
    } else {
      stackSim.current = null;
    }

    // Initialize HeapSim (or WinHeapSim for Windows exercises)
    if (needsHeap) {
      const heap = exercise.winVersion
        ? new WinHeapSim(exercise.heapSize ?? 256, exercise.winVersion)
        : new HeapSim(exercise.heapSize ?? 256, exercise.glibcVersion ?? '2.27');

      if (exercise.mode === 'heap-uaf') {
        const userResult = heap.malloc(16);
        if (userResult) {
          setTimeout(() => {
            dispatch({ type: 'SET_HEAP_NAME', name: 'User', addr: userResult.addr });
            heap._writeLE(userResult.dataAddr, symbols.normal, 4);
            heap.funcPtrs['action'] = { original: symbols.normal, current: symbols.normal } as any;
            dispatch({ type: 'BUMP_VIZ' });
          }, 0);
        }
      } else if (exercise.mode === 'heap-double-free') {
        const aResult = heap.malloc(16);
        if (aResult) {
          heap.funcPtrs['handler'] = { original: symbols.normal, current: symbols.normal } as any;
          setTimeout(() => {
            dispatch({ type: 'SET_HEAP_NAME', name: 'A', addr: aResult.addr });
            dispatch({ type: 'BUMP_VIZ' });
          }, 0);
        }
      } else if (exercise.mode === 'heap-overflow') {
        const aResult = heap.malloc(16);
        const bResult = heap.malloc(16);
        if (aResult && bResult) {
          heap._writeLE(bResult.dataAddr, symbols.normal, 4);
          heap.funcPtrs['handler'] = { original: symbols.normal, current: symbols.normal } as any;
          setTimeout(() => {
            dispatch({ type: 'SET_HEAP_NAME', name: 'A', addr: aResult.addr });
            dispatch({ type: 'SET_HEAP_NAME', name: 'B', addr: bResult.addr });
            dispatch({ type: 'BUMP_VIZ' });
          }, 0);
        }
      } else if (exercise.mode === 'heap-tcache-poison') {
        const aResult = heap.malloc(16);
        const bResult = heap.malloc(16);
        if (aResult && bResult) {
          setTimeout(() => {
            dispatch({ type: 'SET_HEAP_NAME', name: 'A', addr: aResult.addr });
            dispatch({ type: 'SET_HEAP_NAME', name: 'B', addr: bResult.addr });
            dispatch({ type: 'BUMP_VIZ' });
          }, 0);
        }
      } else if (exercise.mode === 'heap-fastbin-dup') {
        for (let i = 0; i < 7; i++) {
          const tmp = heap.malloc(16);
          if (tmp) heap.free(tmp.addr);
        }
        const aResult = heap.malloc(16);
        const bResult = heap.malloc(16);
        if (aResult && bResult) {
          setTimeout(() => {
            dispatch({ type: 'SET_HEAP_NAME', name: 'A', addr: aResult.addr });
            dispatch({ type: 'SET_HEAP_NAME', name: 'B', addr: bResult.addr });
            dispatch({ type: 'BUMP_VIZ' });
          }, 0);
        }
      } else if (exercise.mode === 'heap-unsorted-bin') {
        const aResult = heap.malloc(128);
        const guardResult = heap.malloc(16);
        if (aResult && guardResult) {
          setTimeout(() => {
            dispatch({ type: 'SET_HEAP_NAME', name: 'A', addr: aResult.addr });
            dispatch({ type: 'SET_HEAP_NAME', name: 'guard', addr: guardResult.addr });
            dispatch({ type: 'BUMP_VIZ' });
          }, 0);
        }
      } else if (exercise.mode === 'heap-house-force' || exercise.mode === 'heap-house-orange') {
        const aResult = heap.malloc(16);
        if (aResult) {
          setTimeout(() => {
            dispatch({ type: 'SET_HEAP_NAME', name: 'A', addr: aResult.addr });
            dispatch({ type: 'BUMP_VIZ' });
          }, 0);
        }
      } else if (exercise.mode === 'heap-house-einherjar') {
        const aResult = heap.malloc(16);
        const bResult = heap.malloc(16);
        const cResult = heap.malloc(16);
        const guardResult = heap.malloc(16);
        if (aResult && bResult && cResult && guardResult) {
          setTimeout(() => {
            dispatch({ type: 'SET_HEAP_NAME', name: 'A', addr: aResult.addr });
            dispatch({ type: 'SET_HEAP_NAME', name: 'B', addr: bResult.addr });
            dispatch({ type: 'SET_HEAP_NAME', name: 'C', addr: cResult.addr });
            dispatch({ type: 'SET_HEAP_NAME', name: 'guard', addr: guardResult.addr });
            dispatch({ type: 'BUMP_VIZ' });
          }, 0);
        }
      } else if (exercise.mode === 'heap-house-lore') {
        const aResult = heap.malloc(80);
        const guardResult = heap.malloc(16);
        if (aResult && guardResult) {
          setTimeout(() => {
            dispatch({ type: 'SET_HEAP_NAME', name: 'A', addr: aResult.addr });
            dispatch({ type: 'SET_HEAP_NAME', name: 'guard', addr: guardResult.addr });
            dispatch({ type: 'BUMP_VIZ' });
          }, 0);
        }
      } else if (exercise.mode === 'final-blind') {
        const ptrs: Array<ReturnType<typeof heap.malloc>> = [];
        for (let i = 0; i < 4; i++) {
          ptrs.push(heap.malloc(32));
        }
        if (ptrs[0]) {
          heap._writeLE(ptrs[0].dataAddr, symbols.normal, 4);
          heap.funcPtrs['fn'] = { original: symbols.normal, current: symbols.normal } as any;
        }
        if (ptrs[1]) heap.free(ptrs[1].addr);
        if (ptrs[2]) heap.free(ptrs[2].addr);

        setTimeout(() => {
          if (ptrs[0]) dispatch({ type: 'SET_HEAP_NAME', name: 'ptr0', addr: ptrs[0].addr });
          if (ptrs[1]) dispatch({ type: 'SET_HEAP_NAME', name: 'ptr1', addr: ptrs[1].addr });
          if (ptrs[2]) dispatch({ type: 'SET_HEAP_NAME', name: 'ptr2', addr: ptrs[2].addr });
          if (ptrs[3]) dispatch({ type: 'SET_HEAP_NAME', name: 'ptr3', addr: ptrs[3].addr });
          dispatch({ type: 'BUMP_VIZ' });
        }, 0);
      }

      heapSim.current = heap;
    } else {
      heapSim.current = null;
    }

    // Initialize ASM emulator
    if (exercise.asmInstructions) {
      const arch = exercise.asmArch ?? 'x86';
      let emu;
      if (arch === 'arm') {
        emu = new ArmEmulator(
          exercise.asmInstructions,
          exercise.asmInitialRegs,
          exercise.asmStackBase ?? 0xbfff0200,
        );
      } else if (arch === 'mips') {
        emu = new MipsEmulator(
          exercise.asmInstructions,
          exercise.asmInitialRegs,
          exercise.asmStackBase ?? 0x7ffffffc,
        );
      } else {
        emu = new X86Emulator(
          exercise.asmInstructions,
          exercise.asmInitialRegs,
          exercise.asmStackBase ?? 0xbfff0200,
          arch,
        );
      }
      if (exercise.asmInitialMemory) {
        for (const { addr, value, size } of exercise.asmInitialMemory) {
          emu.writeMem(addr, value, size);
        }
      }
      asmEmulator.current = emu;
    } else {
      asmEmulator.current = null;
    }

    if (exercise.rop || exercise.srop) {
      dispatch({ type: 'SET_REGISTERS', registers: {
        eax: 0, ebx: 0, ecx: 0, edx: 0, esp: 0, eip: 0,
      }});
    }

    dispatch({ type: 'LOAD_EXERCISE', exerciseId: id });
    if (id === 'rit-00') {
      dispatch({ type: 'EXERCISE_COMPLETED', exerciseId: id });
    }
  }, [id]);
  const mobileVizLabel =
    'Assembly';

  if (isMobile) {
    return (
      <div className="mobile-exercise-shell">
        <div>
          <ExerciseDirectionsPanel />
        </div>

        <section className="mobile-workspace">
          <div className="mobile-workspace-tabs" role="tablist" aria-label="Exercise workspace">
            <button
              type="button"
              role="tab"
              aria-selected={activeMobileTab === 'source'}
              className={`mobile-workspace-tab${activeMobileTab === 'source' ? ' active' : ''}`}
              onClick={() => setActiveMobileTab('source')}
            >
              Code
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeMobileTab === 'viz'}
              className={`mobile-workspace-tab${activeMobileTab === 'viz' ? ' active' : ''}`}
              onClick={() => setActiveMobileTab('viz')}
            >
              {mobileVizLabel}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeMobileTab === 'log'}
              className={`mobile-workspace-tab${activeMobileTab === 'log' ? ' active' : ''}`}
              onClick={() => setActiveMobileTab('log')}
            >
              Console
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeMobileTab === 'misc'}
              className={`mobile-workspace-tab${activeMobileTab === 'misc' ? ' active' : ''}`}
              onClick={() => setActiveMobileTab('misc')}
            >
              Misc
            </button>
          </div>

          <div className="mobile-workspace-panel">
            {activeMobileTab === 'source' && <SourcePanel showDescription={false} />}
            {activeMobileTab === 'viz' && (
              <ErrorBoundary>
                <VizPanel />
              </ErrorBoundary>
            )}
            {activeMobileTab === 'log' && <LogPanel />}
            {activeMobileTab === 'misc' && currentExercise && (
              <div className="panel mobile-misc-panel">
                <div className="panel-hdr">misc</div>
                <div className="panel-body">
                  <Toolkit exercise={currentExercise} variant="stack" />
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="mobile-bottom-dock">
          <ErrorBoundary>
            <InputPanel showToolkit={false} />
          </ErrorBoundary>
          <MobileExercisePager />
        </div>
      </div>
    );
  }

  return (
    <>
      <SourcePanel />
      <ErrorBoundary><VizPanel /></ErrorBoundary>
      <ErrorBoundary><InputPanel /></ErrorBoundary>
      <LogPanel />
    </>
  );
}
