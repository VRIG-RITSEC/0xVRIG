'use client';

import { useExerciseContext } from '@/state/ExerciseContext';
import StepControls from './inputs/StepControls';

export default function InputPanel() {
  const { currentExercise } = useExerciseContext();

  let content: React.ReactNode;
  if (!currentExercise) {
    content = <div style={{ color: 'var(--text-dim)' }}>No exercise loaded.</div>;
  } else if (currentExercise.mode === 'step') {
    content = <StepControls />;
  } else {
    content = <div style={{ color: 'var(--text-dim)' }}>Input mode &ldquo;{currentExercise.mode}&rdquo; coming soon.</div>;
  }

  return (
    <div className="panel" id="input-panel">
      <div className="panel-hdr">input</div>
      <div className="panel-body">
        <div id="input-area">
          {content}
        </div>
      </div>
    </div>
  );
}
