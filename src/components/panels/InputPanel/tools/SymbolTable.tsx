'use client';

import { useExerciseContext } from '@/state/ExerciseContext';
import { hex8 } from '@/engine/helpers';

export default function SymbolTable() {
  const { state, currentExercise } = useExerciseContext();
  const ex = currentExercise;
  if (!ex?.showSymbols) return null;

  const entries = Object.entries(state.symbols).filter(([name]) => {
    if (ex.mode.startsWith('heap') || ex.mode.startsWith('final')) {
      return name !== 'vuln' && name !== 'main' && name !== 'sigreturn' && name !== 'system' && name !== 'binsh';
    }
    return true;
  });

  return (
    <div style={{ marginTop: '0.75rem', fontSize: '11px' }}>
      <div style={{ color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
        Functions
      </div>
      {entries.map(([name, addr]) => (
        <div key={name} style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0.1rem 0',
          color: name === 'win' ? 'var(--green)' : 'var(--text)',
        }}>
          <span>{name}()</span>
          <span style={{ color: 'var(--amber)' }}>{hex8(addr)}</span>
        </div>
      ))}
      {ex.funcPtrAddr && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0.1rem 0',
          color: 'var(--green)',
        }}>
          <span>handler (func ptr)</span>
          <span style={{ color: 'var(--amber)' }}>{hex8(ex.funcPtrAddr)}</span>
        </div>
      )}
    </div>
  );
}
