'use client';

import { useExerciseContext } from '@/state/ExerciseContext';
import StackViz from './StackViz';

export default function VizPanel() {
  const { currentExercise } = useExerciseContext();
  const vizMode = currentExercise?.vizMode ?? 'stack';

  let content: React.ReactNode;
  if (vizMode === 'heap') {
    content = <div id="heap-viz" style={{ color: 'var(--text-dim)' }}>Heap visualization coming soon.</div>;
  } else if (vizMode === 'both') {
    content = (
      <>
        <StackViz />
        <div id="heap-viz" style={{ color: 'var(--text-dim)', marginTop: '1rem' }}>Heap visualization coming soon.</div>
      </>
    );
  } else {
    content = <StackViz />;
  }

  return (
    <div className="panel" id="stack-panel">
      <div className="panel-hdr">
        {vizMode === 'heap' ? 'heap' : vizMode === 'both' ? 'stack + heap' : 'stack'}
      </div>
      <div className="panel-body">
        {content}
      </div>
    </div>
  );
}
