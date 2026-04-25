'use client';

import { useState, useCallback } from 'react';
import { useExerciseContext } from '@/state/ExerciseContext';
import { simulateFmtRead } from '@/engine/execution/FmtEngine';
import WalkthroughButton from './WalkthroughButton';

export default function FmtReadInput() {
  const { state, dispatch, stackSim, currentExercise } = useExerciseContext();
  const [payload, setPayload] = useState('');

  const ex = currentExercise;
  const sim = stackSim.current;

  const doRun = useCallback(() => {
    if (!ex || !sim) return;
    if (!payload.trim()) {
      dispatch({ type: 'SHOW_TOAST', message: 'Enter a format string before running printf().' });
      return;
    }

    dispatch({ type: 'CLEAR_LOG' });
    const result = simulateFmtRead(payload, ex, sim, state.symbols);
    for (const log of result.logs) dispatch({ type: 'LOG', cls: log.cls, msg: log.msg });
    if (result.fmtLeakedSecret) {
      dispatch({ type: 'SET_FLAG', flag: 'fmtLeakedSecret', value: true });
    }
    if (result.win) {
      dispatch({ type: 'EXERCISE_COMPLETED', exerciseId: ex.id });
      dispatch({ type: 'SHOW_SUCCESS', title: result.win.title, msg: result.win.msg });
    }
  }, [ex, sim, payload, state.symbols, dispatch]);

  return (
    <div>
      <div style={{ marginBottom: '0.5rem' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
          Enter a format string (e.g., %x.%x.%x.%x):
        </div>
        <textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          placeholder="%x.%x.%x.%x"
          style={{
            width: '100%',
            minHeight: '40px',
            background: 'var(--bg)',
            color: 'var(--text)',
            border: '1px solid var(--panel-border)',
            padding: '0.5rem',
            fontFamily: 'var(--font)',
            fontSize: '12px',
            resize: 'vertical',
          }}
        />
      </div>
      <div className="controls">
        <button className="primary" onClick={doRun}>Run printf()</button>
        <WalkthroughButton />
      </div>
    </div>
  );
}
