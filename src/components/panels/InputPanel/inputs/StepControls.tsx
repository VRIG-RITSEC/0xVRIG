'use client';

import { useEffect } from 'react';
import { useExerciseContext } from '@/state/ExerciseContext';
import { hex8 } from '@/engine/helpers';
import { StackSim } from '@/engine/simulators/StackSim';
import { BASE_SYMBOLS } from '@/exercises/shared/symbols';
import WalkthroughButton from './WalkthroughButton';

function retAddrInMain(symbols: Record<string, number>): number {
  return (symbols.main || BASE_SYMBOLS.main) + 0x25;
}

export default function StepControls() {
  const { state, dispatch, stackSim, heapSim, auxViz, currentExercise } = useExerciseContext();
  const totalSteps = currentExercise?.steps?.length ?? 0;
  const allDone = totalSteps > 0 && state.stepIndex >= totalSteps;

  useEffect(() => {
    if (!totalSteps) {
      dispatch({ type: 'SET_INPUT_PROGRESS', progress: null });
      return;
    }

    const current = Math.min(state.stepIndex + 1, totalSteps);
    dispatch({ type: 'SET_INPUT_PROGRESS', progress: `Step ${current}/${totalSteps}` });

    return () => {
      dispatch({ type: 'SET_INPUT_PROGRESS', progress: null });
    };
  }, [totalSteps, state.stepIndex, dispatch]);

  if (!currentExercise || !currentExercise.steps) return null;

  function handleStep() {
    if (!currentExercise || !currentExercise.steps) return;
    if (state.stepIndex >= currentExercise.steps.length) {
      dispatch({ type: 'LOG', cls: 'info', msg: 'All steps complete.' });
      dispatch({ type: 'BUMP_VIZ' });
      return;
    }

    const step = currentExercise.steps[state.stepIndex];
    const sim = stackSim.current;
    const heap = heapSim.current;

    if (step.action) {
      switch (step.action) {
        case 'malloc':
          if (heap && step.size != null) {
            const result = heap.malloc(step.size);
            if (result && step.name) {
              dispatch({ type: 'SET_HEAP_NAME', name: step.name, addr: result.addr });
            }
          }
          dispatch({ type: 'LOG', cls: step.log[0], msg: step.log[1] });
          break;
        case 'free':
          if (heap && step.name) {
            const addr = state.heapNames[step.name];
            if (addr !== undefined) {
              heap.free(addr);
            }
          }
          dispatch({ type: 'LOG', cls: step.log[0], msg: step.log[1] });
          break;
        case 'done':
          dispatch({ type: 'LOG', cls: step.log[0], msg: step.log[1] });
          break;
        default:
          dispatch({ type: 'LOG', cls: step.log[0], msg: step.log[1] });
          break;
      }
    } else if (step.region) {
      if (!sim) {
        dispatch({ type: 'LOG', cls: step.log[0], msg: step.log[1] });
      } else if (step.region === 'ret') {
        const ret = retAddrInMain(state.symbols);
        sim._writeLE(sim.bufSize + sim.canarySize + sim.ebpSize, ret, sim.retSize);
        sim.markRegion(sim.bufSize + sim.canarySize + sim.ebpSize, sim.totalSize);
        dispatch({
          type: 'LOG',
          cls: 'action',
          msg: `Calling vuln() \u2014 saving the go-back address <span class="log-addr">${hex8(ret)}</span> so we know where to return`,
        });
      } else if (step.region === 'ebp') {
        sim._writeLE(sim.bufSize + sim.canarySize, 0xbfff0200, sim.ebpSize);
        sim.markRegion(sim.bufSize + sim.canarySize, sim.bufSize + sim.canarySize + sim.ebpSize);
        dispatch({ type: 'LOG', cls: step.log[0], msg: step.log[1] });
      } else if (step.region === 'buffer') {
        for (let i = 0; i < sim.bufSize; i++) sim.memory[i] = 0;
        sim.markRegion(0, sim.bufSize);
        dispatch({ type: 'LOG', cls: step.log[0], msg: step.log[1] });
      } else if (step.region === 'all') {
        sim.clearHighlight();
        dispatch({ type: 'LOG', cls: step.log[0], msg: step.log[1] });
      } else {
        dispatch({ type: 'LOG', cls: step.log[0], msg: step.log[1] });
      }
    } else {
      dispatch({ type: 'LOG', cls: step.log[0], msg: step.log[1] });
    }

    if (step.vizAction) {
      step.vizAction(sim, heap, auxViz.current);
    }

    if (step.srcLine !== undefined) dispatch({ type: 'SET_EXEC_LINE', line: step.srcLine });
    dispatch({ type: 'INCREMENT_STEP' });
    dispatch({ type: 'BUMP_VIZ' });

    if (state.stepIndex + 1 >= currentExercise.steps.length) {
      dispatch({ type: 'EXERCISE_COMPLETED', exerciseId: currentExercise.id });
    }
  }

  function handleReset() {
    if (!currentExercise) return;
    const sim = stackSim.current;

    if (sim) {
      const newSim = new StackSim({
        bufSize: currentExercise.bufSize ?? 16,
        retAddr: retAddrInMain(state.symbols),
        savedEbp: 0xbfff0200,
      });
      newSim.clearBlank();
      stackSim.current = newSim;
    }

    dispatch({ type: 'SET_STEP_INDEX', index: 0 });
    dispatch({ type: 'SET_EXEC_LINE', line: -1 });
    dispatch({ type: 'CLEAR_LOG' });
    dispatch({ type: 'BUMP_VIZ' });
  }

  return (
    <div className="controls">
      <button className="primary" onClick={handleStep} disabled={allDone}>
        Step
      </button>
      <button onClick={handleReset}>
        Reset
      </button>
      <WalkthroughButton />
      {allDone && (
        <span style={{ color: 'var(--green)', fontSize: '12px', alignSelf: 'center' }}>
          All steps complete {'\u2713'}
        </span>
      )}
    </div>
  );
}
