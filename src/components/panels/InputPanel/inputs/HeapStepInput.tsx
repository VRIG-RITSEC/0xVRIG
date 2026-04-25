'use client';

import { useState, useCallback, useEffect } from 'react';
import { useExerciseContext } from '@/state/ExerciseContext';
import { hexStrToBytes } from '@/engine/helpers';
import WalkthroughButton from './WalkthroughButton';
import {
  UAF_STEPS, DF_STEPS, TCP_STEPS, FBD_STEPS, USB_STEPS,
  HOF_STEPS, HOS_STEPS, HOO_STEPS, HOE_STEPS, HOL_STEPS,
  executeHeapGuidedStep, HeapGuidedStep,
  heapUafSubmit, heapDoubleFreeSubmit, heapOverflowSubmit,
  heapTcachePoisonSubmit, heapFastbinDupSubmit, heapUnsortedBinSubmit,
} from '@/engine/execution/HeapStepEngine';

function getStepsForMode(mode: string): HeapGuidedStep[] {
  switch (mode) {
    case 'heap-uaf': return UAF_STEPS;
    case 'heap-double-free': return DF_STEPS;
    case 'heap-tcache-poison': return TCP_STEPS;
    case 'heap-fastbin-dup': return FBD_STEPS;
    case 'heap-unsorted-bin': return USB_STEPS;
    case 'heap-house-force': return HOF_STEPS;
    case 'heap-house-spirit': return HOS_STEPS;
    case 'heap-house-orange': return HOO_STEPS;
    case 'heap-house-einherjar': return HOE_STEPS;
    case 'heap-house-lore': return HOL_STEPS;
    default: return [];
  }
}

export default function HeapStepInput() {
  const { state, dispatch, heapSim, currentExercise } = useExerciseContext();
  const [payload, setPayload] = useState('');

  const ex = currentExercise;
  const heap = heapSim.current;
  const phase = state.heapPhase;
  const steps = getStepsForMode(ex?.mode ?? '');
  const hasSteps = steps.length > 0;
  const isInputPhase = !hasSteps || phase === 'input' || phase === 'overwrite-top' || phase === 'fake-headers' || phase === 'free-fake' || phase === 'final-write' || phase === 'null-byte' || phase === 'corrupt-top' || phase === 'bk-write';

  useEffect(() => {
    if (!hasSteps || isInputPhase) {
      dispatch({ type: 'SET_INPUT_PROGRESS', progress: null });
      return;
    }

    const current = Math.min(state.heapStep + 1, steps.length);
    dispatch({ type: 'SET_INPUT_PROGRESS', progress: `Step ${current}/${steps.length}` });

    return () => {
      dispatch({ type: 'SET_INPUT_PROGRESS', progress: null });
    };
  }, [dispatch, hasSteps, isInputPhase, state.heapStep, steps.length]);

  const doStep = useCallback(() => {
    if (!ex || !heap) return;
    const steps = getStepsForMode(ex.mode);
    if (state.heapStep >= steps.length) return;

    const step = steps[state.heapStep];
    if (step.srcLine !== undefined) dispatch({ type: 'SET_EXEC_LINE', line: step.srcLine });
    const result = executeHeapGuidedStep(step, heap, state.heapNames);
    for (const log of result.logs) dispatch({ type: 'LOG', cls: log.cls, msg: log.msg });
    if (result.heapNames) {
      for (const [name, addr] of Object.entries(result.heapNames)) {
        if (addr !== state.heapNames[name]) {
          dispatch({ type: 'SET_HEAP_NAME', name, addr });
        }
      }
    }
    if (result.phase) {
      dispatch({ type: 'SET_HEAP_PHASE', phase: result.phase });
    }
    dispatch({ type: 'SET_HEAP_STEP', step: state.heapStep + 1 });
    dispatch({ type: 'BUMP_VIZ' });
  }, [ex, heap, state.heapStep, state.heapNames, dispatch]);

  const doSubmit = useCallback(() => {
    if (!ex || !heap) return;
    if (!payload.trim()) {
      dispatch({ type: 'SHOW_TOAST', message: 'Enter a hex payload before submitting.' });
      return;
    }

    const bytes = hexStrToBytes(payload);
    if (bytes.length === 0) {
      dispatch({ type: 'SHOW_TOAST', message: 'That hex payload is invalid. Enter valid hex bytes first.' });
      return;
    }

    let result;
    const funcPtrAddr = ex.funcPtrAddr ?? 0x0804a040;

    switch (ex.mode) {
      case 'heap-uaf':
        result = heapUafSubmit(bytes, heap, state.heapNames, state.symbols);
        break;
      case 'heap-double-free':
        result = heapDoubleFreeSubmit(bytes, heap, state.heapNames, state.symbols, funcPtrAddr);
        break;
      case 'heap-overflow':
        result = heapOverflowSubmit(bytes, heap, state.heapNames, state.symbols);
        break;
      case 'heap-tcache-poison':
        result = heapTcachePoisonSubmit(bytes, heap, state.heapNames, state.symbols, funcPtrAddr);
        break;
      case 'heap-fastbin-dup':
        result = heapFastbinDupSubmit(bytes, heap, state.heapNames, state.symbols, funcPtrAddr);
        break;
      case 'heap-unsorted-bin':
        result = heapUnsortedBinSubmit(bytes, heap, state.heapNames, state.symbols, funcPtrAddr);
        break;
      default:
        // For house-of-* exercises, use a generic submit
        result = heapGenericSubmit(bytes, heap, state.heapNames, state.symbols, ex);
        break;
    }

    if (result) {
      for (const log of result.logs) dispatch({ type: 'LOG', cls: log.cls, msg: log.msg });
      if (result.completed) {
        dispatch({ type: 'EXERCISE_COMPLETED', exerciseId: ex.id });
        dispatch({ type: 'SHOW_SUCCESS', title: ex.winTitle, msg: ex.winMsg });
      }
      dispatch({ type: 'BUMP_VIZ' });
    }
  }, [ex, heap, payload, state.heapNames, state.symbols, dispatch]);

  if (!isInputPhase) {
    return (
      <div>
        <div className="controls">
          <button className="primary" onClick={doStep}>Step</button>
          <WalkthroughButton />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '0.5rem' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
          Enter hex bytes:
        </div>
        <textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          placeholder="Enter hex bytes: 50 81 04 08 ..."
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
        <button className="primary" onClick={doSubmit}>Submit</button>
        <WalkthroughButton />
      </div>
    </div>
  );
}

function heapGenericSubmit(
  bytes: number[],
  heap: any,
  heapNames: Record<string, number>,
  symbols: Record<string, number>,
  ex: any,
) {
  const result = { logs: [] as Array<{ cls: string; msg: string }>, completed: false };
  const funcPtrAddr = ex.funcPtrAddr ?? 0x0804a040;

  // Generic handler for house-of-* exercises
  // Write bytes to the first available chunk
  const aAddr = heapNames['A'];
  if (aAddr !== undefined) {
    const dataAddr = aAddr + heap.HEADER_SIZE;
    heap.write(dataAddr, bytes);
    result.logs.push({ cls: 'action', msg: 'Wrote ' + bytes.length + ' bytes.' });

    // Check if the exercise is solved
    if (ex.check(null, heap, symbols, {})) {
      result.logs.push({ cls: 'success', msg: 'Exercise completed!' });
      result.completed = true;
    }
  }

  return result;
}
