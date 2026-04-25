'use client';

import { useExerciseContext } from '@/state/ExerciseContext';

export default function WalkthroughButton() {
  const { dispatch } = useExerciseContext();

  return (
    <button
      type="button"
      className="walkthrough-button"
      onClick={() => dispatch({ type: 'SHOW_SOLUTION_GUIDE' })}
    >
      Walkthrough
    </button>
  );
}
