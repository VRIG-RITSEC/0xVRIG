'use client';

import { use, useEffect } from 'react';
import { useExerciseContext } from '@/state/ExerciseContext';
import { getExercise } from '@/exercises/registry';
import { StackSim } from '@/engine/simulators/StackSim';
import { BASE_SYMBOLS } from '@/exercises/shared/symbols';
import SourcePanel from '@/components/panels/SourcePanel/SourcePanel';
import VizPanel from '@/components/panels/VizPanel/VizPanel';
import InputPanel from '@/components/panels/InputPanel/InputPanel';
import LogPanel from '@/components/panels/LogPanel/LogPanel';

function retAddrInMain(symbols: Record<string, number>): number {
  return (symbols.main || BASE_SYMBOLS.main) + 0x25;
}

export default function ExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state, dispatch, stackSim } = useExerciseContext();

  useEffect(() => {
    const exercise = getExercise(id);
    if (!exercise) return;

    // Initialize StackSim for this exercise
    const sim = new StackSim({
      bufSize: exercise.bufSize ?? 16,
      retAddr: retAddrInMain(state.symbols),
      savedEbp: 0xbfff0200,
      useCanary: exercise.canary,
    });

    // For step mode, start with blank memory
    if (exercise.mode === 'step') {
      sim.clearBlank();
    }

    stackSim.current = sim;
    dispatch({ type: 'LOAD_EXERCISE', exerciseId: id });
  }, [id]);

  return (
    <>
      <SourcePanel />
      <VizPanel />
      <InputPanel />
      <LogPanel />
    </>
  );
}
