'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadProgress, saveProgress } from '@/state/persistence';
import { TRACKS, UNITS, getExercise, BADGES, getAllExercises } from '@/exercises/registry';
import { getTrackEra, ERA_LABELS, type Era } from '@/lib/era';

const ERA_STYLES: Record<Era, {
  titleBar: React.CSSProperties;
  titleText: React.CSSProperties;
  body: React.CSSProperties;
  border: string;
  accent: string;
  bodyText: string;
  dimText: string;
  tagText: string;
  barColor: string;
  barBg: string;
  controls: string;
}> = {
  win95: {
    titleBar: {
      background: 'linear-gradient(90deg, #00007B, #1084D0)',
      padding: '4px 8px',
      borderBottom: '1px solid #000080',
    },
    titleText: { color: '#fff', fontWeight: 'bold', fontFamily: 'Arial, sans-serif', fontSize: '12px' },
    body: { background: '#C0C0C0', padding: '8px' },
    border: '2px outset #808080',
    accent: '#004040',
    bodyText: '#000000',
    dimText: '#4A4A4A',
    tagText: '#004040',
    barColor: '#000080',
    barBg: '#A0A0A0',
    controls: '— □ ×',
  },
  winxp: {
    titleBar: {
      background: 'linear-gradient(180deg, #0058E6, #3C8CF4, #2470E0, #0054E3)',
      padding: '5px 10px',
      borderBottom: '1px solid #003088',
      borderRadius: '6px 6px 0 0',
    },
    titleText: {
      color: '#fff', fontWeight: 'bold', fontFamily: 'Tahoma, sans-serif', fontSize: '12px',
      textShadow: '1px 1px 1px rgba(0,0,0,0.3)',
    },
    body: { background: 'rgba(16, 26, 44, 0.92)', padding: '10px' },
    border: '1px solid rgba(0, 83, 227, 0.5)',
    accent: '#6CB4EE',
    bodyText: 'rgba(244,246,248,0.85)',
    dimText: 'rgba(244,246,248,0.5)',
    tagText: '#6CB4EE',
    barColor: '#3080F0',
    barBg: 'rgba(0, 83, 227, 0.2)',
    controls: '— □ ×',
  },
  win7: {
    titleBar: {
      background: 'linear-gradient(180deg, rgba(100, 170, 240, 0.15), rgba(60, 120, 200, 0.08))',
      padding: '6px 10px',
      borderBottom: '1px solid rgba(100, 170, 240, 0.1)',
      borderRadius: '6px 6px 0 0',
      backdropFilter: 'blur(20px)',
    },
    titleText: {
      color: '#fff', fontWeight: '600', fontFamily: '"Segoe UI", system-ui, sans-serif', fontSize: '12px',
      textShadow: '0 0 8px rgba(72, 170, 240, 0.3)',
    },
    body: { background: 'rgba(16, 30, 55, 0.7)', padding: '10px', backdropFilter: 'blur(20px)' },
    border: '1px solid rgba(100, 170, 240, 0.2)',
    accent: '#5EB7F8',
    bodyText: 'rgba(244,246,248,0.85)',
    dimText: 'rgba(244,246,248,0.5)',
    tagText: '#5EB7F8',
    barColor: '#5EB7F8',
    barBg: 'rgba(72, 170, 240, 0.1)',
    controls: '● ● ●',
  },
  win11: {
    titleBar: {
      background: 'rgba(255, 255, 255, 0.04)',
      padding: '6px 12px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
      borderRadius: '8px 8px 0 0',
    },
    titleText: {
      color: 'rgba(255,255,255,0.9)', fontWeight: '600',
      fontFamily: 'system-ui, "Segoe UI Variable", sans-serif', fontSize: '12px',
    },
    body: { background: 'rgba(40, 40, 40, 0.8)', padding: '12px', backdropFilter: 'blur(40px)' },
    border: '1px solid rgba(255, 255, 255, 0.06)',
    accent: '#60CDFF',
    bodyText: 'rgba(244,246,248,0.85)',
    dimText: 'rgba(244,246,248,0.5)',
    tagText: '#60CDFF',
    barColor: '#60CDFF',
    barBg: 'rgba(96, 205, 255, 0.08)',
    controls: '━ ▢ ✕',
  },
};

const ERA_RADIUS: Record<Era, string> = {
  win95: '0',
  winxp: '6px',
  win7: '6px',
  win11: '8px',
};

export default function Dashboard() {
  const router = useRouter();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [adminInput, setAdminInput] = useState('');

  useEffect(() => {
    setCompleted(loadProgress());
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.classList.add('intro-page');
    document.documentElement.classList.add('intro-page');

    return () => {
      document.body.classList.remove('intro-page');
      document.documentElement.classList.remove('intro-page');
    };
  }, []);

  if (!mounted) return null;

  const allExercises = getAllExercises();
  const totalCount = allExercises.length;
  const completedCount = allExercises.filter(ex => completed.has(ex.id)).length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

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

  const recentIds = allExercises
    .filter(ex => completed.has(ex.id))
    .slice(-5)
    .reverse();

  const earnedBadges = BADGES.filter(b => b.condition(completed));

  return (
    <div style={{
      maxWidth: '680px',
      margin: '3rem auto',
      padding: '1.5rem',
      fontFamily: 'var(--font-sans)',
      color: '#f4f6f8',
    }}>
      <h1 style={{
        fontSize: '28px',
        fontWeight: 800,
        letterSpacing: '0.04em',
        marginBottom: '0.15rem',
        background: 'linear-gradient(90deg, #f59e3b, #6de2d5)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        0xVRIG
      </h1>
      <p style={{ color: 'rgba(244,246,248,0.55)', fontSize: '13px', marginBottom: '1.5rem' }}>
        Learn binary exploitation through four eras of computing
      </p>

      <div style={{
        marginBottom: '1.5rem',
        padding: '0.75rem 1rem',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '6px',
      }}>
        <div style={{ fontSize: '12px', marginBottom: '0.5rem', color: 'rgba(244,246,248,0.7)' }}>
          Overall Progress
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden',
          }}>
            <div style={{
              width: `${pct}%`, height: '100%',
              background: 'linear-gradient(90deg, #f59e3b, #6de2d5)',
              borderRadius: '3px',
              transition: 'width 0.3s ease',
            }} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#f59e3b', minWidth: '3.5rem', textAlign: 'right' }}>
            {completedCount}/{totalCount}
          </span>
        </div>
      </div>

      {continueExercise && (
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            className="link-button primary"
            onClick={() => router.push(`/exercise/${continueExercise!.id}`)}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Continue: {continueExercise.title} &rarr;
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        {TRACKS.map(track => {
          const era = getTrackEra(track.id);
          const s = ERA_STYLES[era];
          const radius = ERA_RADIUS[era];
          const trackUnits = track.unitIds
            .map(uid => UNITS.find(u => u.id === uid))
            .filter(Boolean) as typeof UNITS;
          const total = trackUnits.reduce((sum, u) => sum + u.exerciseIds.length, 0);
          const done = trackUnits.reduce(
            (sum, u) => sum + u.exerciseIds.filter(id => completed.has(id)).length, 0
          );
          const trackPct = total > 0 ? Math.round((done / total) * 100) : 0;
          const firstExId = trackUnits[0]?.exerciseIds[0];

          return (
            <div
              key={track.id}
              style={{
                border: s.border,
                borderRadius: radius,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onClick={() => firstExId && router.push(`/exercise/${firstExId}`)}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 20px rgba(0,0,0,0.3)`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = '';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '';
              }}
            >
              <div style={{
                ...s.titleBar,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={s.titleText}>{track.name}</span>
                <span style={{
                  ...s.titleText,
                  fontSize: '9px',
                  fontWeight: 'normal',
                  opacity: 0.5,
                  letterSpacing: '3px',
                  textShadow: 'none',
                }}>{s.controls}</span>
              </div>
              <div style={{
                ...s.body,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '10px',
                    color: s.dimText,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '4px',
                  }}>
                    {ERA_LABELS[era]}
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    flexWrap: 'wrap',
                  }}>
                    {trackUnits.map(u => (
                      <span key={u.id} style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        background: s.barBg,
                        color: s.tagText,
                        borderRadius: era === 'win95' ? '0' : '3px',
                        border: era === 'win95' ? `1px solid ${s.accent}` : 'none',
                      }}>
                        {u.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: '60px' }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: done === total && total > 0 ? s.accent : s.bodyText,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {done}/{total}
                  </div>
                  <div style={{
                    width: '60px',
                    height: '3px',
                    background: s.barBg,
                    borderRadius: '2px',
                    overflow: 'hidden',
                    marginTop: '4px',
                  }}>
                    <div style={{
                      width: `${trackPct}%`,
                      height: '100%',
                      background: s.barColor,
                      borderRadius: '2px',
                    }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {recentIds.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            color: 'rgba(244,246,248,0.4)', fontSize: '10px', textTransform: 'uppercase',
            letterSpacing: '0.06em', marginBottom: '0.35rem',
          }}>
            Recently Completed
          </div>
          {recentIds.map(ex => (
            <div key={ex.id} style={{ fontSize: '12px', padding: '0.15rem 0' }}>
              <span style={{ color: '#6de2d5' }}>{'✓'}</span>{' '}
              <span
                style={{ cursor: 'pointer', color: 'rgba(244,246,248,0.8)' }}
                onClick={() => router.push(`/exercise/${ex.id}`)}
              >
                {ex.title}
              </span>
            </div>
          ))}
        </div>
      )}

      {earnedBadges.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            color: 'rgba(244,246,248,0.4)', fontSize: '10px', textTransform: 'uppercase',
            letterSpacing: '0.06em', marginBottom: '0.35rem',
          }}>
            Badges Earned
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {earnedBadges.map(b => (
              <span key={b.id} style={{
                fontSize: '11px', padding: '0.2rem 0.6rem',
                border: '1px solid rgba(245,158,59,0.4)', color: '#f59e3b',
                borderRadius: '4px', background: 'rgba(245,158,59,0.06)',
              }}>
                {b.icon} {b.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {completedCount === 0 && (
        <div>
          <button
            className="link-button secondary"
            onClick={() => router.push('/exercise/asm-01')}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Start from scratch
          </button>
        </div>
      )}

      <div style={{
        marginTop: '2rem',
        paddingTop: '1rem',
        borderTop: '1px solid rgba(255,255,255,0.06)',
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
            border: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(244,246,248,0.4)',
            fontFamily: 'var(--font-sans)',
            fontSize: '10px',
            padding: '0.25rem 0.5rem',
            width: '100px',
            outline: 'none',
            borderRadius: '4px',
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
