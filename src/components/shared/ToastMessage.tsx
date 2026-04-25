'use client';

import { useEffect } from 'react';
import { useExerciseContext } from '@/state/ExerciseContext';

export default function ToastMessage() {
  const { state, dispatch } = useExerciseContext();

  useEffect(() => {
    if (!state.toast) return undefined;
    const timer = setTimeout(() => dispatch({ type: 'DISMISS_TOAST' }), 2600);
    return () => clearTimeout(timer);
  }, [state.toast, dispatch]);

  if (!state.toast) return null;

  return (
    <div className="app-toast" role="status" aria-live="polite">
      {state.toast.message}
    </div>
  );
}
