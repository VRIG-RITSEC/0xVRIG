'use client';

import { useExerciseContext } from '@/state/ExerciseContext';

export default function PayloadBuilder() {
  const { currentExercise } = useExerciseContext();
  const ex = currentExercise;
  if (!ex?.showBuilder) return null;

  return (
    <div style={{ marginTop: '0.75rem', fontSize: '11px' }}>
      <div style={{ color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
        Payload Builder Tips
      </div>
      <div style={{ color: 'var(--text-dim)' }}>
        <div>Buffer: {ex.bufSize} bytes of padding (e.g., 41 repeated)</div>
        <div>Saved EBP: 4 bytes of junk (e.g., 42 42 42 42)</div>
        <div>Return addr: 4 bytes in little-endian</div>
        {ex.canary && <div style={{ color: 'var(--purple)' }}>Canary: 4 bytes at offset {ex.bufSize} (leak it first!)</div>}
      </div>
    </div>
  );
}
