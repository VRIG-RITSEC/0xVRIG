'use client';

import { useState } from 'react';
import { useExerciseContext } from '@/state/ExerciseContext';
import TextHexInput from './TextHexInput';

export default function IntOverflowInput() {
  const { currentExercise } = useExerciseContext();
  const [intValue, setIntValue] = useState('');
  const [showPayload, setShowPayload] = useState(false);

  const ex = currentExercise;
  const headerSize = ex?.headerSize ?? 64;

  const val = parseInt(intValue);
  const isValid = !isNaN(val);
  const total = isValid ? (val + headerSize) >>> 0 : 0;
  const wraps = isValid && total < val;

  return (
    <div>
      <div style={{ marginBottom: '0.5rem' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
          Enter the length value (unsigned int):
        </div>
        <input
          type="text"
          value={intValue}
          onChange={(e) => {
            setIntValue(e.target.value);
            const v = parseInt(e.target.value);
            setShowPayload(!isNaN(v) && ((v + headerSize) >>> 0) < v);
          }}
          placeholder="e.g., 4294967232"
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
      </div>
      {isValid && (
        <div style={{ fontSize: '11px', marginBottom: '0.5rem' }}>
          <div>
            total = {val} + {headerSize} ={' '}
            <strong style={{ color: wraps ? 'var(--red)' : 'var(--green)' }}>
              {total} (0x{total.toString(16).toUpperCase().padStart(8, '0')})
            </strong>
          </div>
          {wraps && (
            <div style={{ color: 'var(--red)' }}>
              Integer overflow! Buffer will be only {total} bytes but {val} bytes will be read!
            </div>
          )}
        </div>
      )}
      {showPayload && (
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
            Now enter your hex payload to overflow the tiny buffer:
          </div>
          <TextHexInput />
        </div>
      )}
    </div>
  );
}
