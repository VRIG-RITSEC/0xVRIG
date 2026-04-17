'use client';

import { useExerciseContext } from '@/state/ExerciseContext';
import { hex8 } from '@/engine/helpers';

export default function GadgetTable() {
  const { currentExercise } = useExerciseContext();
  const ex = currentExercise;
  if (!ex?.showGadgetTable || !ex.gadgets) return null;

  return (
    <div style={{ marginTop: '0.75rem', fontSize: '11px' }}>
      <div style={{ color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
        ROP Gadgets
      </div>
      {Object.entries(ex.gadgets).map(([addrStr, desc]) => {
        const addr = parseInt(addrStr);
        return (
          <div key={addrStr} style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.15rem 0',
            cursor: 'pointer',
            color: 'var(--text)',
          }}
          title="Click to copy LE bytes"
          onClick={() => {
            const le = [(addr) & 0xff, (addr >>> 8) & 0xff, (addr >>> 16) & 0xff, (addr >>> 24) & 0xff];
            const hexStr = le.map(b => b.toString(16).padStart(2, '0')).join(' ');
            navigator.clipboard?.writeText(hexStr);
          }}
          >
            <span style={{ color: 'var(--amber)' }}>{hex8(addr)}</span>
            <span style={{ color: 'var(--yellow)' }}>{desc}</span>
          </div>
        );
      })}
      {ex.flagAddr && (
        <div style={{ padding: '0.15rem 0', marginTop: '0.25rem', borderTop: '1px solid var(--panel-border)' }}>
          <span style={{ color: 'var(--text-dim)' }}>flag_check: </span>
          <span style={{ color: 'var(--amber)' }}>{hex8(ex.flagAddr)}</span>
        </div>
      )}
      {ex.magicValue && (
        <div style={{ padding: '0.15rem 0' }}>
          <span style={{ color: 'var(--text-dim)' }}>magic value: </span>
          <span style={{ color: 'var(--amber)' }}>{hex8(ex.magicValue)}</span>
        </div>
      )}
    </div>
  );
}
