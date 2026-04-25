'use client';

import { useState, useCallback, useEffect } from 'react';
import { useExerciseContext } from '@/state/ExerciseContext';
import { hexStrToBytes, strToBytes } from '@/engine/helpers';
import { generateExecSteps, execCurrentStep, ExecStep } from '@/engine/execution/StepEngine';
import WalkthroughButton from './WalkthroughButton';

export default function TextHexInput() {
  const { state, dispatch, stackSim, currentExercise } = useExerciseContext();
  const [payload, setPayload] = useState('');
  const [mode, setMode] = useState<'text' | 'hex'>(currentExercise?.mode === 'input-hex' ? 'hex' : state.inputMode);
  const [execSteps, setExecSteps] = useState<ExecStep[] | null>(null);
  const [execIndex, setExecIndex] = useState(0);
  const [ropState] = useState<{ ropEax?: number; ropEbx?: number; ropFlagValue?: number }>({});

  const ex = currentExercise;
  const sim = stackSim.current;

  useEffect(() => {
    if (!execSteps) {
      dispatch({ type: 'SET_INPUT_PROGRESS', progress: null });
      return;
    }

    const completed = Math.min(execIndex, execSteps.length);
    dispatch({ type: 'SET_INPUT_PROGRESS', progress: `Step ${completed}/${execSteps.length}` });

    return () => {
      dispatch({ type: 'SET_INPUT_PROGRESS', progress: null });
    };
  }, [execSteps, execIndex, dispatch]);

  const doStep = useCallback(() => {
    if (!ex || !sim) return;

    // Generate steps if not started
    if (!execSteps) {
      if (!payload.trim()) {
        dispatch({ type: 'SHOW_TOAST', message: 'Enter a payload first before stepping the program.' });
        return;
      }
      const bytes = mode === 'hex' ? hexStrToBytes(payload) : strToBytes(payload);
      if (!bytes.length) {
        dispatch({ type: 'SHOW_TOAST', message: 'That input is empty. Enter a payload before running.' });
        return;
      }

      sim.resetForInput();
      sim.clearBlank();
      const steps = generateExecSteps(ex, bytes, sim, state.symbols);
      setExecSteps(steps);
      setExecIndex(0);
      dispatch({ type: 'BUMP_VIZ' });

      // Execute first step
      if (steps.length > 0) {
        const result = execCurrentStep(steps[0], sim, ex, state.symbols, ropState);
        if (result.highlightLine !== undefined) dispatch({ type: 'SET_EXEC_LINE', line: result.highlightLine });
        for (const log of result.logs) dispatch({ type: 'LOG', cls: log.cls, msg: log.msg });
        if (result.registerUpdates) dispatch({ type: 'SET_REGISTERS', registers: result.registerUpdates });
        if (result.flagUpdates) {
          for (const [flag, value] of Object.entries(result.flagUpdates)) {
            dispatch({ type: 'SET_FLAG', flag, value });
          }
        }
        if (result.win) {
          dispatch({ type: 'EXERCISE_COMPLETED', exerciseId: ex.id });
          dispatch({ type: 'SHOW_SUCCESS', title: result.win.title, msg: result.win.msg });
        }
        if (result.canaryFailed) {
          setExecSteps(null);
        }
        dispatch({ type: 'BUMP_VIZ' });
        setExecIndex(1);
      }
      return;
    }

    if (execIndex >= execSteps.length) {
      dispatch({ type: 'LOG', cls: 'info', msg: 'Execution complete. Reset to try again.' });
      return;
    }

    const step = execSteps[execIndex];
    const result = execCurrentStep(step, sim, ex, state.symbols, ropState);
    if (result.highlightLine !== undefined) dispatch({ type: 'SET_EXEC_LINE', line: result.highlightLine });
    for (const log of result.logs) dispatch({ type: 'LOG', cls: log.cls, msg: log.msg });
    if (result.registerUpdates) dispatch({ type: 'SET_REGISTERS', registers: result.registerUpdates });
    if (result.flagUpdates) {
      for (const [flag, value] of Object.entries(result.flagUpdates)) {
        dispatch({ type: 'SET_FLAG', flag, value });
      }
    }
    if (result.win) {
      dispatch({ type: 'EXERCISE_COMPLETED', exerciseId: ex.id });
      dispatch({ type: 'SHOW_SUCCESS', title: result.win.title, msg: result.win.msg });
    }
    if (result.canaryFailed) {
      setExecSteps(null);
    }
    dispatch({ type: 'BUMP_VIZ' });
    setExecIndex(execIndex + 1);
  }, [ex, sim, execSteps, execIndex, payload, mode, state.symbols, dispatch, ropState]);

  const doRunAll = useCallback(async () => {
    if (!ex || !sim) return;

    let steps = execSteps;
    let idx = execIndex;

    if (!steps) {
      if (!payload.trim()) {
        dispatch({ type: 'SHOW_TOAST', message: 'Enter a payload first before running the program.' });
        return;
      }
      const bytes = mode === 'hex' ? hexStrToBytes(payload) : strToBytes(payload);
      if (!bytes.length) {
        dispatch({ type: 'SHOW_TOAST', message: 'That input is empty. Enter a payload before running.' });
        return;
      }
      sim.resetForInput();
      sim.clearBlank();
      steps = generateExecSteps(ex, bytes, sim, state.symbols);
      setExecSteps(steps);
      idx = 0;
    }

    dispatch({ type: 'SET_RUNNING', running: true });
    for (let i = idx; i < steps.length; i++) {
      const step = steps[i];
      const result = execCurrentStep(step, sim, ex, state.symbols, ropState);
      if (result.highlightLine !== undefined) dispatch({ type: 'SET_EXEC_LINE', line: result.highlightLine });
      for (const log of result.logs) dispatch({ type: 'LOG', cls: log.cls, msg: log.msg });
      if (result.registerUpdates) dispatch({ type: 'SET_REGISTERS', registers: result.registerUpdates });
      if (result.flagUpdates) {
        for (const [flag, value] of Object.entries(result.flagUpdates)) {
          dispatch({ type: 'SET_FLAG', flag, value });
        }
      }
      if (result.win) {
        dispatch({ type: 'EXERCISE_COMPLETED', exerciseId: ex.id });
        dispatch({ type: 'SHOW_SUCCESS', title: result.win.title, msg: result.win.msg });
      }
      dispatch({ type: 'BUMP_VIZ' });
      if (result.canaryFailed) {
        setExecSteps(null);
        break;
      }
      setExecIndex(i + 1);
      await new Promise(r => setTimeout(r, step.label.includes('OVERFLOW') ? 300 : 150));
    }
    dispatch({ type: 'SET_RUNNING', running: false });
  }, [ex, sim, execSteps, execIndex, payload, mode, state.symbols, dispatch, ropState]);

  const doReset = useCallback(() => {
    if (!sim) return;
    sim.resetForInput();
    setExecSteps(null);
    setExecIndex(0);
    dispatch({ type: 'CLEAR_LOG' });
    dispatch({ type: 'SET_EXEC_LINE', line: -1 });
    dispatch({ type: 'BUMP_VIZ' });
    dispatch({ type: 'SET_RUNNING', running: false });
  }, [sim, dispatch]);

  const isTextMode = ex?.mode === 'input-text';

  return (
    <div>
      <div style={{ marginBottom: '0.5rem' }}>
        {isTextMode && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              <input type="radio" name="mode" checked={mode === 'hex'} onChange={() => setMode('hex')} /> Hex
            </label>
            <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              <input type="radio" name="mode" checked={mode === 'text'} onChange={() => setMode('text')} /> ASCII
            </label>
          </div>
        )}
        <textarea
          value={payload}
          onChange={(e) => {
            setPayload(e.target.value);
            setExecSteps(null);
            setExecIndex(0);
          }}
          placeholder={isTextMode ? (mode === 'hex' ? 'Enter hex bytes: 41 41 41 41 ...' : 'Type your input here...') : 'Enter hex bytes: 41 41 41 41 ...'}
          style={{
            width: '100%',
            minHeight: '60px',
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
        <button className="primary" onClick={doStep} disabled={state.running}>Step</button>
        <button onClick={doRunAll} disabled={state.running}>Run</button>
        <button onClick={doReset}>Reset</button>
        <WalkthroughButton />
      </div>
    </div>
  );
}
