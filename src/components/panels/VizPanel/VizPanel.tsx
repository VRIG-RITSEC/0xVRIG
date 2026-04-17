'use client';

import { useExerciseContext } from '@/state/ExerciseContext';
import StackViz from './StackViz';
import HeapViz from './HeapViz';

export default function VizPanel() {
  const { currentExercise } = useExerciseContext();
  const vizMode = currentExercise?.vizMode ?? 'stack';

  let content: React.ReactNode;
  if (vizMode === 'heap') {
    content = <HeapViz />;
  } else if (vizMode === 'both') {
    content = (
      <>
        <StackViz />
        <div style={{ marginTop: '1rem' }}>
          <HeapViz />
        </div>
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
