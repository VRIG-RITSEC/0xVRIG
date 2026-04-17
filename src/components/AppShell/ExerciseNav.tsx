'use client';

import { useRouter } from 'next/navigation';
import { useExerciseContext } from '@/state/ExerciseContext';
import { UNITS, getExercise } from '@/exercises/registry';

export default function ExerciseNav() {
  const router = useRouter();
  const { state } = useExerciseContext();

  return (
    <nav id="exercise-nav">
      {UNITS.map((unit) => {
        if (unit.exerciseIds.length === 0) return null;
        return (
          <span key={unit.id} style={{ display: 'contents' }}>
            <span className="nav-unit-label">{unit.name}</span>
            {unit.exerciseIds.map((exId) => {
              const ex = getExercise(exId);
              if (!ex) return null;

              const isActive = state.currentExerciseId === exId;
              const isCompleted = state.completed.has(exId);

              const classes = [''];
              if (isActive) classes.push('active');
              if (isCompleted) classes.push('completed');

              // Extract numeric part from id for display (e.g., 'stack-01' -> '01')
              const numMatch = exId.match(/(\d+)$/);
              const label = numMatch ? numMatch[1].padStart(2, '0') : exId;

              return (
                <button
                  key={exId}
                  className={classes.join(' ').trim()}
                  title={ex.title}
                  onClick={() => router.push(`/exercise/${exId}`)}
                >
                  {label}
                </button>
              );
            })}
          </span>
        );
      })}
    </nav>
  );
}
