'use client';

import { useState } from 'react';
import { hex8 } from '@/engine/helpers';

export default function HexCalculator() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [op, setOp] = useState<'+' | '-'>('+');

  const va = parseInt(a.replace(/^0x/i, ''), 16);
  const vb = parseInt(b.replace(/^0x/i, ''), 16);
  const isValid = !isNaN(va) && !isNaN(vb);
  const result = isValid ? (op === '+' ? (va + vb) >>> 0 : (va - vb) >>> 0) : 0;

  return (
    <div style={{ marginTop: '0.75rem', fontSize: '11px' }}>
      <div style={{ color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
        Hex Calculator
      </div>
      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
        <input
          type="text"
          value={a}
          onChange={(e) => setA(e.target.value)}
          placeholder="0x..."
          style={{
            width: '80px',
            background: 'var(--bg)',
            color: 'var(--text)',
            border: '1px solid var(--panel-border)',
            padding: '0.2rem 0.4rem',
            fontFamily: 'var(--font)',
            fontSize: '11px',
          }}
        />
        <select
          value={op}
          onChange={(e) => setOp(e.target.value as '+' | '-')}
          style={{
            background: 'var(--bg)',
            color: 'var(--text)',
            border: '1px solid var(--panel-border)',
            fontFamily: 'var(--font)',
            fontSize: '11px',
          }}
        >
          <option value="+">+</option>
          <option value="-">-</option>
        </select>
        <input
          type="text"
          value={b}
          onChange={(e) => setB(e.target.value)}
          placeholder="0x..."
          style={{
            width: '80px',
            background: 'var(--bg)',
            color: 'var(--text)',
            border: '1px solid var(--panel-border)',
            padding: '0.2rem 0.4rem',
            fontFamily: 'var(--font)',
            fontSize: '11px',
          }}
        />
        <span style={{ color: 'var(--text-dim)' }}>=</span>
        <span style={{ color: isValid ? 'var(--green)' : 'var(--text-dim)' }}>
          {isValid ? hex8(result) : '...'}
        </span>
      </div>
    </div>
  );
}
