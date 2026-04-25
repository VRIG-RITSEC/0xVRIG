'use client';

import { useState, useCallback } from 'react';
import { useExerciseContext } from '@/state/ExerciseContext';
import { hexStrToBytes, hex8 } from '@/engine/helpers';
import WalkthroughButton from './WalkthroughButton';

export default function FinalBlindInput() {
  const { state, dispatch, heapSim, currentExercise } = useExerciseContext();
  const [phase, setPhase] = useState<'uaf-write' | 'final-write'>('uaf-write');
  const [payload1, setPayload1] = useState('');
  const [payload2, setPayload2] = useState('');

  const ex = currentExercise;
  const heap = heapSim.current;

  const doUafWrite = useCallback(() => {
    if (!heap || !ex) return;
    if (!payload1.trim()) {
      dispatch({ type: 'SHOW_TOAST', message: 'Enter a hex payload before submitting phase 1.' });
      return;
    }

    const bytes = hexStrToBytes(payload1);
    // Write to ptrs[2]'s data (the UAF write)
    const ptr2Addr = state.heapNames['ptr2'];
    if (ptr2Addr === undefined) {
      dispatch({ type: 'LOG', cls: 'error', msg: 'Chunks not set up.' });
      return;
    }

    const dataAddr = ptr2Addr + heap.HEADER_SIZE;
    heap.write(dataAddr, bytes);
    const targetAddr = heap._readLE(dataAddr, 4);

    dispatch({ type: 'LOG', cls: 'action', msg: 'read(0, ptrs[2], 32) \u2014 overwrote freed chunk\'s fd to <span class="log-addr">' + hex8(targetAddr) + '</span>' });

    // malloc(32) gets ptrs[2] back
    heap.malloc(32);
    dispatch({ type: 'LOG', cls: 'action', msg: 'void *x = malloc(32) \u2014 returns ptrs[2] from tcache.' });

    // malloc(32) follows poisoned fd
    dispatch({ type: 'LOG', cls: 'action', msg: 'void *y = malloc(32) \u2014 follows poisoned fd to <span class="log-addr">' + hex8(targetAddr) + '</span>' });

    dispatch({ type: 'SET_HEAP_NAME', name: 'y_target', addr: targetAddr });
    dispatch({ type: 'BUMP_VIZ' });
    setPhase('final-write');
  }, [heap, ex, payload1, state.heapNames, dispatch]);

  const doFinalWrite = useCallback(() => {
    if (!heap || !ex) return;
    if (!payload2.trim()) {
      dispatch({ type: 'SHOW_TOAST', message: 'Enter the value to write before submitting phase 2.' });
      return;
    }

    const bytes = hexStrToBytes(payload2);
    const writtenVal = bytes.length >= 4 ? (bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24)) >>> 0 : 0;

    dispatch({ type: 'LOG', cls: 'action', msg: 'read(0, y, 4) \u2014 writing <span class="log-addr">' + hex8(writtenVal) + '</span>' });

    // Check if they wrote win's address to ptrs[0]'s fn
    const symbols = state.symbols;
    const ptr0Addr = state.heapNames['ptr0'];
    if (ptr0Addr !== undefined) {
      const ptr0DataAddr = ptr0Addr + heap.HEADER_SIZE;
      // If y points to ptr0's data area, this write overwrites the fn pointer
      heap.funcPtrs['fn'] = { original: symbols.normal, current: writtenVal } as any;

      if (writtenVal === symbols.win) {
        dispatch({ type: 'LOG', cls: 'success', msg: 'ptrs[0]->fn() now points to win()! Executing...' });
        dispatch({ type: 'EXERCISE_COMPLETED', exerciseId: ex.id });
        dispatch({ type: 'SHOW_SUCCESS', title: ex.winTitle, msg: ex.winMsg });
      } else {
        dispatch({ type: 'LOG', cls: 'error', msg: 'fn() is ' + hex8(writtenVal) + ' \u2014 not win(). Think about what address win() is at.' });
      }
    }

    dispatch({ type: 'BUMP_VIZ' });
  }, [heap, ex, payload2, state.heapNames, state.symbols, dispatch]);

  if (phase === 'uaf-write') {
    return (
      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
          Phase 1: Write to freed ptrs[2] (poison the tcache fd pointer)
        </div>
        <textarea
          value={payload1}
          onChange={(e) => setPayload1(e.target.value)}
          placeholder="Enter hex bytes for tcache poison..."
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
        <div className="controls" style={{ marginTop: '0.5rem' }}>
          <button className="primary" onClick={doUafWrite}>Submit Phase 1</button>
          <WalkthroughButton />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
        Phase 2: Write 4 bytes to y (which points to your target)
      </div>
      <textarea
        value={payload2}
        onChange={(e) => setPayload2(e.target.value)}
        placeholder="Enter hex bytes (win address in LE)..."
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
      <div className="controls" style={{ marginTop: '0.5rem' }}>
        <button className="primary" onClick={doFinalWrite}>Submit Phase 2</button>
        <WalkthroughButton />
      </div>
    </div>
  );
}
