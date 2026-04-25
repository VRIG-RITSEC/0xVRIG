'use client';

import { useState, useCallback } from 'react';
import { useExerciseContext } from '@/state/ExerciseContext';
import { hexStrToBytes, hex8 } from '@/engine/helpers';
import WalkthroughButton from './WalkthroughButton';

export default function FinalChainInput() {
  const { state, dispatch, heapSim, currentExercise } = useExerciseContext();
  const [phase, setPhase] = useState<'count' | 'payload'>('count');
  const [count, setCount] = useState('');
  const [payload, setPayload] = useState('');

  const ex = currentExercise;
  const heap = heapSim.current;

  const doCount = useCallback(() => {
    if (!heap) return;
    const val = parseInt(count);
    if (isNaN(val)) {
      dispatch({ type: 'SHOW_TOAST', message: 'Enter a valid count before submitting.' });
      return;
    }

    const allocSize = (val * 4) & 0xFFFF; // 16-bit wrap
    dispatch({ type: 'CLEAR_LOG' });
    dispatch({ type: 'LOG', cls: 'action', msg: 'count = ' + val + ', count * 4 = ' + (val * 4) });

    if (allocSize < 64) {
      dispatch({ type: 'LOG', cls: 'error', msg: 'Integer overflow! 16-bit wrap: ' + (val * 4) + ' & 0xFFFF = ' + allocSize });
      dispatch({ type: 'LOG', cls: 'action', msg: 'malloc(' + allocSize + ') \u2014 tiny buffer allocated!' });

      // Allocate buf and cfg
      const buf = heap.malloc(allocSize || 8);
      const cfg = heap.malloc(16);
      if (buf) dispatch({ type: 'SET_HEAP_NAME', name: 'buf', addr: buf.addr });
      if (cfg) {
        dispatch({ type: 'SET_HEAP_NAME', name: 'cfg', addr: cfg.addr });
        // Set handler to normal
        heap._writeLE(cfg.dataAddr, state.symbols.normal, 4);
        heap.funcPtrs['handler'] = { original: state.symbols.normal, current: state.symbols.normal } as any;
        dispatch({ type: 'LOG', cls: 'action', msg: 'cfg at <span class="log-addr">' + hex8(heap.baseAddr + cfg.dataAddr) + '</span> \u2014 info leak!' });
      }
      dispatch({ type: 'BUMP_VIZ' });
      setPhase('payload');
    } else {
      dispatch({ type: 'LOG', cls: 'info', msg: 'No overflow. Try a value where count*4 wraps around in 16 bits.' });
    }
  }, [count, heap, state.symbols, dispatch]);

  const doSubmit = useCallback(() => {
    if (!heap || !ex) return;
    if (!payload.trim()) {
      dispatch({ type: 'SHOW_TOAST', message: 'Enter a hex payload before submitting.' });
      return;
    }

    const bytes = hexStrToBytes(payload);
    const bufAddr = state.heapNames['buf'];
    if (bufAddr === undefined) return;

    const bufDataAddr = bufAddr + heap.HEADER_SIZE;
    heap.write(bufDataAddr, bytes);

    dispatch({ type: 'LOG', cls: 'action', msg: 'read(0, buf, 256) \u2014 wrote ' + bytes.length + ' bytes.' });

    // Check if handler was overwritten
    const cfgAddr = state.heapNames['cfg'];
    if (cfgAddr !== undefined) {
      const cfgDataAddr = cfgAddr + heap.HEADER_SIZE;
      const handlerVal = heap._readLE(cfgDataAddr, 4);
      heap.funcPtrs['handler'] = { original: state.symbols.normal, current: handlerVal } as any;

      dispatch({ type: 'LOG', cls: 'action', msg: 'cfg->handler() is now <span class="log-addr">' + hex8(handlerVal) + '</span>' });

      if (handlerVal === state.symbols.win) {
        dispatch({ type: 'LOG', cls: 'success', msg: 'handler() points to win()! Executing...' });
        dispatch({ type: 'EXERCISE_COMPLETED', exerciseId: ex.id });
        dispatch({ type: 'SHOW_SUCCESS', title: ex.winTitle, msg: ex.winMsg });
      } else {
        dispatch({ type: 'LOG', cls: 'error', msg: 'Not win(). Calculate the offset from buf to cfg->handler and write win()\'s address there.' });
      }
    }

    dispatch({ type: 'BUMP_VIZ' });
  }, [heap, ex, payload, state.heapNames, state.symbols, dispatch]);

  if (phase === 'count') {
    return (
      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
          How many items? (unsigned short)
        </div>
        <input
          type="text"
          value={count}
          onChange={(e) => setCount(e.target.value)}
          placeholder="e.g., 16384"
          style={{
            width: '100%',
            background: 'var(--bg)',
            color: 'var(--text)',
            border: '1px solid var(--panel-border)',
            padding: '0.5rem',
            fontFamily: 'var(--font)',
            fontSize: '12px',
          }}
        />
        <div className="controls" style={{ marginTop: '0.5rem' }}>
          <button className="primary" onClick={doCount}>Submit Count</button>
          <WalkthroughButton />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '0.5rem' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
          Enter hex payload (overflow buf into cfg):
        </div>
        <textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          placeholder="Enter hex bytes..."
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
        <button className="primary" onClick={doSubmit}>Submit Payload</button>
        <WalkthroughButton />
      </div>
    </div>
  );
}
