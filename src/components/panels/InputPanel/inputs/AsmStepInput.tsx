'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useExerciseContext } from '@/state/ExerciseContext';
import { Emulator } from '@/engine/emulator-interface';
import { StepResult } from '@/engine/x86/types';
import WalkthroughButton from './WalkthroughButton';

interface AsmStepInputProps {
  emulator: Emulator | null;
  onStepResult?: (result: StepResult) => void;
}

export default function AsmStepInput({ emulator, onStepResult }: AsmStepInputProps) {
  const { dispatch, currentExercise } = useExerciseContext();
  const [stepCount, setStepCount] = useState(0);
  const changedRegsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    dispatch({ type: 'SET_INPUT_PROGRESS', progress: `Steps ${stepCount}` });
    return () => {
      dispatch({ type: 'SET_INPUT_PROGRESS', progress: null });
    };
  }, [stepCount, dispatch]);

  const triggerWin = useCallback(() => {
    if (!currentExercise) return;
    const ex = currentExercise;
    if (ex.check(null, null, {}, {})) {
      dispatch({ type: 'EXERCISE_COMPLETED', exerciseId: ex.id });
      dispatch({ type: 'SHOW_SUCCESS', title: ex.winTitle, msg: ex.winMsg });
    }
  }, [currentExercise, dispatch]);

  const doStep = useCallback(() => {
    if (!emulator || emulator.state.halted) return;

    const result = emulator.step();
    if (!result) return;

    changedRegsRef.current = new Set(result.diffs.map(d => d.reg));
    setStepCount(c => c + 1);

    dispatch({ type: 'LOG', cls: 'info', msg: result.log });
    dispatch({ type: 'BUMP_VIZ' });

    if (onStepResult) onStepResult(result);

    if (result.halted) {
      dispatch({ type: 'LOG', cls: 'success', msg: 'Program halted.' });
      triggerWin();
    }
  }, [emulator, dispatch, onStepResult, triggerWin]);

  const doRun = useCallback(() => {
    if (!emulator || emulator.state.halted) return;

    let steps = 0;
    while (!emulator.state.halted && steps < 500) {
      const result = emulator.step();
      if (!result) break;
      dispatch({ type: 'LOG', cls: 'info', msg: result.log });
      steps++;
    }

    setStepCount(c => c + steps);
    dispatch({ type: 'BUMP_VIZ' });

    if (emulator.state.halted) {
      dispatch({ type: 'LOG', cls: 'success', msg: `Program halted after ${steps} instructions.` });
      triggerWin();
    } else {
      dispatch({ type: 'LOG', cls: 'warning', msg: `Stopped after ${steps} instructions (limit reached).` });
    }
  }, [emulator, dispatch]);

  const doReset = useCallback(() => {
    if (!emulator) return;
    emulator.reset();
    changedRegsRef.current.clear();
    setStepCount(0);
    dispatch({ type: 'CLEAR_LOG' });
    dispatch({ type: 'BUMP_VIZ' });
    dispatch({ type: 'LOG', cls: 'info', msg: 'Emulator reset.' });
  }, [emulator, dispatch]);

  const currentInstr = emulator?.getCurrentInstruction();
  const halted = emulator?.state.halted ?? true;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="controls">
        <button className="primary" onClick={doStep} disabled={halted}>
          Step
        </button>
        <button onClick={doRun} disabled={halted}>
          Run All
        </button>
        <button onClick={doReset}>
          Reset
        </button>
        <WalkthroughButton />
      </div>

      <div style={{ fontSize: '11px', color: 'var(--dim)' }}>
        {currentInstr && !halted && (
          <span style={{ color: 'var(--fg)' }}>
            Next: <span style={{ color: 'var(--warning)' }}>{currentInstr.mnemonic}</span>{' '}
            {currentInstr.operands}
          </span>
        )}
        {halted && (
          <span style={{ color: 'var(--danger)' }}>
            [HALTED]
          </span>
        )}
      </div>

      {currentInstr?.comment && (
        <div style={{ fontSize: '11px', color: 'var(--accent)', fontStyle: 'italic' }}>
          💡 {currentInstr.comment}
        </div>
      )}
    </div>
  );
}
