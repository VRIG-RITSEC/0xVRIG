'use client';

import { useState } from 'react';
import { useExerciseContext } from '@/state/ExerciseContext';
import { hex8, hex2 } from '@/engine/helpers';

export default function SigframeBuilder() {
  const { state, currentExercise } = useExerciseContext();
  const ex = currentExercise;
  if (!ex?.showSigframe) return null;

  const [regs, setRegs] = useState<Record<string, string>>({
    eip: '', esp: '', eax: '', ebx: '', ecx: '', edx: '',
  });

  const updateReg = (name: string, value: string) => {
    setRegs(r => ({ ...r, [name]: value }));
  };

  const buildPayload = () => {
    const vals: Record<string, number> = {};
    for (const f of ['eax', 'ebx', 'ecx', 'edx', 'esp', 'eip']) {
      const v = parseInt((regs[f] || '0').replace(/^0x/i, ''), 16);
      vals[f] = isNaN(v) ? 0 : v >>> 0;
    }

    const sim = { bufSize: ex.bufSize ?? 16 };
    const sigreturnAddr = state.symbols.sigreturn || 0x080481b0;

    const padding: number[] = [];
    for (let i = 0; i < sim.bufSize; i++) padding.push(0x41);
    const junkEbp = [0x42, 0x42, 0x42, 0x42];
    const sigretLE = [sigreturnAddr & 0xff, (sigreturnAddr >>> 8) & 0xff, (sigreturnAddr >>> 16) & 0xff, (sigreturnAddr >>> 24) & 0xff];

    const frameRegs = [vals.eax, vals.ebx, vals.ecx, vals.edx, vals.esp, vals.eip];
    const frameBytes: number[] = [];
    for (const v of frameRegs) {
      frameBytes.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff);
    }

    const all = [...padding, ...junkEbp, ...sigretLE, ...frameBytes];
    return all.map(b => hex2(b)).join(' ');
  };

  return (
    <div style={{ marginTop: '0.75rem', fontSize: '11px' }}>
      <div style={{ color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
        Signal Frame Builder
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
        {['eip', 'esp', 'eax', 'ebx', 'ecx', 'edx'].map(reg => (
          <div key={reg} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ color: 'var(--blue)', width: '2.5em' }}>{reg.toUpperCase()}</span>
            <input
              type="text"
              value={regs[reg]}
              onChange={(e) => updateReg(reg, e.target.value)}
              placeholder={reg === 'eip' ? hex8(state.symbols.win) : '0x00000000'}
              style={{
                flex: 1,
                background: 'var(--bg)',
                color: 'var(--text)',
                border: '1px solid var(--panel-border)',
                padding: '0.15rem 0.3rem',
                fontFamily: 'var(--font)',
                fontSize: '10px',
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ marginTop: '0.25rem' }}>
        <button className="btn" onClick={() => {
          const payload = buildPayload();
          navigator.clipboard?.writeText(payload);
        }}>
          Copy Payload
        </button>
        <span style={{ color: 'var(--text-dim)', marginLeft: '0.5rem' }}>
          sigreturn at {hex8(state.symbols.sigreturn || 0x080481b0)}
        </span>
      </div>
    </div>
  );
}
