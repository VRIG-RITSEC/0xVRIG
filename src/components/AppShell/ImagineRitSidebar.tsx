'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useExerciseContext } from '@/state/ExerciseContext';

const IMAGINE_RIT_EXERCISES = [
  { id: 'rit-01', title: 'The Stack Frame' },
  { id: 'rit-02', title: 'The Overflow' },
  { id: 'rit-03', title: 'Hijack Execution' },
  { id: 'rit-04', title: 'Randomized Addresses' },
  { id: 'rit-rop', title: "Baby's First ROP" },
];

export default function ImagineRitSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useExerciseContext();

  const activeId = pathname?.split('/imagine-rit/')[1] ?? '';

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <div className="sidebar-track">
          <div className="sidebar-track-header" style={{ cursor: 'default' }}>
            <span className="sidebar-track-name">Imagine RIT</span>
            <span className="sidebar-track-count">
              {IMAGINE_RIT_EXERCISES.filter(ex => state.completed.has(ex.id)).length}/{IMAGINE_RIT_EXERCISES.length}
            </span>
          </div>

          {IMAGINE_RIT_EXERCISES.map((ex, i) => {
            const isActive = activeId === ex.id;
            const isCompleted = state.completed.has(ex.id);

            return (
              <button
                key={ex.id}
                className={`sidebar-exercise${isActive ? ' active' : ''}${isCompleted ? ' completed' : ''}`}
                onClick={() => router.push(`/imagine-rit/${ex.id}`)}
                title={ex.title}
              >
                <span className="sidebar-exercise-title">
                  {String(i + 1).padStart(2, '0')}. {ex.title}
                </span>
                {isCompleted && (
                  <span className="sidebar-exercise-check">{'✓'}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
