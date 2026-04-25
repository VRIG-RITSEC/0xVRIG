'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadProgress, saveProgress } from '@/state/persistence';
import { TRACKS, UNITS, getExercise, BADGES, getAllExercises } from '@/exercises/registry';

export default function Dashboard() {
  const router = useRouter();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [adminInput, setAdminInput] = useState('');

  useEffect(() => {
    setCompleted(loadProgress());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const allExercises = getAllExercises();
  const totalCount = allExercises.length;
  const completedCount = allExercises.filter(ex => completed.has(ex.id)).length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const barWidth = 30;
  const filled = Math.round((pct / 100) * barWidth);
  const progressBar = '='.repeat(filled) + '-'.repeat(barWidth - filled);

  // Find next incomplete exercise
  let continueExercise: { id: string; title: string } | null = null;
  for (const track of TRACKS) {
    for (const unitId of track.unitIds) {
      const unit = UNITS.find(u => u.id === unitId);
      if (!unit) continue;
      for (const exId of unit.exerciseIds) {
        if (!completed.has(exId)) {
          const ex = getExercise(exId);
          if (ex) {
            continueExercise = { id: exId, title: ex.title };
            break;
          }
        }
      }
      if (continueExercise) break;
    }
    if (continueExercise) break;
  }

  // Recent completions (last 5)
  const recentIds = allExercises
    .filter(ex => completed.has(ex.id))
    .slice(-5)
    .reverse();

  const earnedBadges = BADGES.filter(b => b.condition(completed));

  return (
    <div style={{
      maxWidth: '600px',
      margin: '4rem auto',
      padding: '2rem',
      fontFamily: 'var(--font)',
      color: 'var(--text)',
    }}>
      <h1 style={{ color: 'var(--green)', fontSize: '24px', fontWeight: 'normal', marginBottom: '0.25rem' }}>
        0xVRIG
      </h1>
      <p style={{ color: 'var(--text-dim)', fontSize: '12px', marginBottom: '2rem' }}>
        Learn binary exploitation by doing
      </p>

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '13px', marginBottom: '0.5rem' }}>
          Progress: {completedCount}/{totalCount}{' '}
          <span style={{ color: 'var(--text-dim)' }}>[{progressBar}]</span>{' '}
          <span style={{ color: 'var(--green)' }}>{pct}%</span>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        {TRACKS.map(track => {
          const trackUnits = track.unitIds
            .map(uid => UNITS.find(u => u.id === uid))
            .filter(Boolean) as typeof UNITS;
          const total = trackUnits.reduce((s, u) => s + u.exerciseIds.length, 0);
          const done = trackUnits.reduce(
            (s, u) => s + u.exerciseIds.filter(id => completed.has(id)).length, 0
          );
          const blocks = 10;
          const filledBlocks = total > 0 ? Math.round((done / total) * blocks) : 0;
          const bar = '\u2588'.repeat(filledBlocks) + '\u2591'.repeat(blocks - filledBlocks);

          return (
            <div key={track.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.3rem 0', fontSize: '12px',
            }}>
              <span style={{ width: '140px', color: done === total && total > 0 ? 'var(--green)' : 'var(--text)' }}>
                {track.name}
              </span>
              <span style={{ color: 'var(--green)', letterSpacing: '1px', fontFamily: 'var(--font)' }}>
                {bar}
              </span>
              <span style={{ color: 'var(--text-dim)', width: '50px', textAlign: 'right' }}>
                {done}/{total}
              </span>
            </div>
          );
        })}
      </div>

      {continueExercise && (
        <div style={{ marginBottom: '2rem' }}>
          <button
            className="link-button primary"
            onClick={() => router.push(`/exercise/${continueExercise!.id}`)}
          >
            Continue: {continueExercise.title} &rarr;
          </button>
        </div>
      )}

      {recentIds.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
            Recently Completed
          </div>
          {recentIds.map(ex => (
            <div key={ex.id} style={{ fontSize: '12px', padding: '0.15rem 0' }}>
              <span style={{ color: 'var(--green)' }}>{'\u2713'}</span>{' '}
              <span
                style={{ cursor: 'pointer', color: 'var(--text)' }}
                onClick={() => router.push(`/exercise/${ex.id}`)}
              >
                {ex.title}
              </span>
            </div>
          ))}
        </div>
      )}

      {earnedBadges.length > 0 && (
        <div>
          <div style={{ color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
            Badges Earned
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {earnedBadges.map(b => (
              <span key={b.id} style={{
                fontSize: '11px', padding: '0.15rem 0.5rem',
                border: '1px solid var(--yellow)', color: 'var(--yellow)', borderRadius: '2px',
              }}>
                {b.icon} {b.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {completedCount === 0 && (
        <div style={{ marginTop: '1rem' }}>
          <button
            className="link-button secondary"
            onClick={() => router.push('/exercise/asm-01')}
          >
            Start from scratch
          </button>
        </div>
      )}

      <div style={{
        marginTop: '3rem',
        paddingTop: '1rem',
        borderTop: '1px solid var(--panel-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        <input
          type="password"
          placeholder="Admin"
          value={adminInput}
          onChange={e => setAdminInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && adminInput === 'AdminVRIGPassword') {
              const allIds = new Set(getAllExercises().map(ex => ex.id));
              saveProgress(allIds);
              setCompleted(allIds);
              setAdminInput('');
            }
          }}
          style={{
            background: 'transparent',
            border: '1px solid var(--panel-border)',
            color: 'var(--text-dim)',
            fontFamily: 'var(--font)',
            fontSize: '10px',
            padding: '0.25rem 0.5rem',
            width: '100px',
            outline: 'none',
          }}
        />
        <button
          className="link-button secondary-accent"
          onClick={() => {
            const empty = new Set<string>();
            saveProgress(empty);
            setCompleted(empty);
          }}
        >
          Reset Progress
        </button>
      </div>
    </div>
  );
}
