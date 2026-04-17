'use client';

import { useExerciseContext } from '@/state/ExerciseContext';

export default function SuccessBanner() {
  const { state, dispatch, currentExercise } = useExerciseContext();

  if (!state.showSuccess) return null;

  return (
    <div id="success-banner" className="show">
      <h2>{state.showSuccess.title}</h2>
      <p>{state.showSuccess.msg}</p>
      {currentExercise?.realWorld && (
        <div style={{
          marginTop: '1rem',
          padding: '0.5rem 0.75rem',
          border: '1px solid var(--panel-border)',
          textAlign: 'left',
          fontSize: '11px',
          lineHeight: '1.5',
        }}>
          <div style={{ color: 'var(--text-dim)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
            In the Wild
          </div>
          <div style={{ color: 'var(--text-dim)' }}>{currentExercise.realWorld}</div>
        </div>
      )}
      <button onClick={() => dispatch({ type: 'DISMISS_SUCCESS' })}>
        Continue
      </button>
    </div>
  );
}
