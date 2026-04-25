'use client';

import { useEffect, useRef } from 'react';
import { useExerciseContext } from '@/state/ExerciseContext';

export default function LogPanel() {
  const { state } = useExerciseContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.logMessages.length]);

  return (
    <div className="panel" id="log-panel">
      <div className="panel-hdr">console</div>
      <div className="panel-body" ref={scrollRef}>
        <div id="exec-log">
          {state.logMessages.map((entry, i) => (
            <div
              key={i}
              className={`log-entry log-${entry.cls}`}
              dangerouslySetInnerHTML={{ __html: entry.msg }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
