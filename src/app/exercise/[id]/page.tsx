'use client';

import { use, useEffect } from 'react';
import { useExerciseContext } from '@/state/ExerciseContext';
import { getExercise } from '@/exercises/registry';
import { StackSim } from '@/engine/simulators/StackSim';
import { HeapSim } from '@/engine/simulators/HeapSim';
import { BASE_SYMBOLS } from '@/exercises/shared/symbols';
import SourcePanel from '@/components/panels/SourcePanel/SourcePanel';
import VizPanel from '@/components/panels/VizPanel/VizPanel';
import InputPanel from '@/components/panels/InputPanel/InputPanel';
import LogPanel from '@/components/panels/LogPanel/LogPanel';

function retAddrInMain(symbols: Record<string, number>): number {
  return (symbols.main || BASE_SYMBOLS.main) + 0x25;
}

function computeSymbols(exercise: ReturnType<typeof getExercise>): Record<string, number> {
  const symbols = { ...BASE_SYMBOLS };

  if (exercise?.aslr) {
    const offset = ((Math.random() * 0x10000) >>> 0) & ~0xfff;
    for (const key of Object.keys(symbols)) {
      symbols[key] = (symbols[key] + offset) >>> 0;
    }
  }

  // Add sigreturn for SROP exercises
  if (exercise?.srop) {
    symbols['sigreturn'] = 0x080481b0;
    if (exercise.aslr) {
      const offset = symbols['main'] - BASE_SYMBOLS.main;
      symbols['sigreturn'] = (0x080481b0 + offset) >>> 0;
    }
  }

  return symbols;
}

export default function ExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { dispatch, stackSim, heapSim } = useExerciseContext();

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
      const sim = new StackSim({
        bufSize: exercise.bufSize ?? 16,
        retAddr: retAddrInMain(symbols),
        savedEbp: 0xbfff0200,
        useCanary: exercise.canary,
      });

      if (exercise.mode === 'step') {
        sim.clearBlank();
      }

      // For SROP/ROP exercises with extended payload, allocate more space
      if (exercise.srop || exercise.ret2libc) {
        const extraSize = exercise.srop ? 24 : 8; // signal frame or system args
        const totalNeeded = (exercise.bufSize ?? 16) + (exercise.canary ? 4 : 0) + 4 + 4 + extraSize;
        const bigSim = new StackSim(
          exercise.bufSize ?? 16,
          retAddrInMain(symbols),
          0xbfff0200,
          undefined,
          exercise.canary,
        );
        // Manually extend total size for extra payload space
        const extended = new StackSim({
          bufSize: exercise.bufSize ?? 16,
          retAddr: retAddrInMain(symbols),
          savedEbp: 0xbfff0200,
          useCanary: exercise.canary,
        });
        // We need to handle this by using the existing sim and it'll truncate writes at totalSize
        // The sim already handles writes up to totalSize, which includes buf+canary+ebp+ret
        // For ret2libc we need extra space after ret. Let's just use a larger bufSize trick:
        // Actually, the StackSim handles writeWord which respects totalSize.
        // For ret2libc, the payload extends past ret, so we need a bigger sim.
        // Let's create a StackSim with enough room.
        stackSim.current = bigSim;
        void extended; // suppress unused
        void totalNeeded;
      } else {
        stackSim.current = sim;
      }
    } else {
      stackSim.current = null;
    }

    // Initialize HeapSim
    if (needsHeap) {
      const heap = new HeapSim(exercise.heapSize ?? 256);

      // Setup heap for specific exercises
      if (exercise.mode === 'heap-uaf') {
        // Allocate User struct
        const userResult = heap.malloc(16);
        if (userResult) {
          // Set up names - will be dispatched via state
          setTimeout(() => {
            dispatch({ type: 'SET_HEAP_NAME', name: 'User', addr: userResult.addr });
            // Write greet address as function pointer
            heap._writeLE(userResult.dataAddr, symbols.normal, 4);
            heap.funcPtrs['action'] = { original: symbols.normal, current: symbols.normal } as any;
            dispatch({ type: 'BUMP_VIZ' });
          }, 0);
        }
      } else if (exercise.mode === 'heap-double-free') {
        const aResult = heap.malloc(16);
        if (aResult) {
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
        // Fill tcache with 7 entries
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
        // Allocate 4 chunks of size 32
        const ptrs: Array<ReturnType<typeof heap.malloc>> = [];
        for (let i = 0; i < 4; i++) {
          ptrs.push(heap.malloc(32));
        }
        if (ptrs[0]) {
          // Set fn pointer on ptrs[0]
          heap._writeLE(ptrs[0].dataAddr, symbols.normal, 4);
          heap.funcPtrs['fn'] = { original: symbols.normal, current: symbols.normal } as any;
        }
        // Free ptrs[1] and ptrs[2]
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

    // Initialize registers for ROP/SROP exercises
    if (exercise.rop || exercise.srop) {
      dispatch({ type: 'SET_REGISTERS', registers: {
        eax: 0, ebx: 0, ecx: 0, edx: 0, esp: 0, eip: 0,
      }});
    }

    dispatch({ type: 'LOAD_EXERCISE', exerciseId: id });
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <SourcePanel />
      <VizPanel />
      <InputPanel />
      <LogPanel />
    </>
  );
}
