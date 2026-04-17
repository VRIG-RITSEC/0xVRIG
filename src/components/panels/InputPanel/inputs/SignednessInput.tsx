'use client';

import { useState } from 'react';
import TextHexInput from './TextHexInput';

export default function SignednessInput() {
  const [signedVal, setSignedVal] = useState('');
  const [showPayload, setShowPayload] = useState(false);

  const val = parseInt(signedVal);
  const isValid = !isNaN(val);
  const passesCheck = isValid && !(val > 64);
  const isNegative = isValid && val < 0;
  const unsigned = isValid ? val >>> 0 : 0;

  return (
    <div>
      <div style={{ marginBottom: '0.5rem' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
          Enter a signed integer length:
        </div>
        <input
          type="text"
          value={signedVal}
          onChange={(e) => {
            setSignedVal(e.target.value);
            const v = parseInt(e.target.value);
            setShowPayload(!isNaN(v) && !(v > 64) && v < 0);
          }}
          placeholder="e.g., -1"
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
            if (len &gt; 64): {val} &gt; 64?{' '}
            <strong style={{ color: passesCheck ? 'var(--green)' : 'var(--red)' }}>
              {passesCheck ? 'NO \u2014 check passes!' : 'YES \u2014 rejected!'}
            </strong>
          </div>
          {passesCheck && isNegative && (
            <>
              <div style={{ color: 'var(--red)', marginTop: '0.25rem' }}>
                Cast to unsigned: (size_t){val} \u2192 <strong>{unsigned}</strong> (0x{unsigned.toString(16).toUpperCase()})
              </div>
              <div style={{ color: 'var(--red)' }}>
                memcpy will try to copy {unsigned} bytes!
              </div>
            </>
          )}
        </div>
      )}
      {showPayload && (
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
            Now enter your hex payload:
          </div>
          <TextHexInput />
        </div>
      )}
    </div>
  );
}
