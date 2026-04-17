'use client';

import { useExerciseContext } from '@/state/ExerciseContext';

export default function SuccessBanner() {
  const { state, dispatch } = useExerciseContext();

  if (!state.showSuccess) return null;

  return (
    <div id="success-banner" className="show">
      <h2>{state.showSuccess.title}</h2>
      <p>{state.showSuccess.msg}</p>
      <button onClick={() => dispatch({ type: 'DISMISS_SUCCESS' })}>
        Continue
      </button>
    </div>
  );
}
