'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadProgress } from '@/state/persistence';

const EXERCISES = [
  { id: 'rit-00', title: '00: How to Use 0xVRIG', desc: 'Get comfortable with the panels, controls, tools, and navigation before the exploitation lessons begin.' },
  { id: 'rit-01', title: '01: The Stack Frame', desc: 'Watch how the computer organizes memory — like a stack of sticky notes.' },
  { id: 'rit-02', title: '02: The Overflow', desc: 'Type too much and crash the program. Yes, it\'s that easy.' },
  { id: 'rit-03', title: '03: Hijack Execution', desc: 'Make the program run a secret function it was never supposed to call.' },
  { id: 'rit-04', title: '04: Randomized Addresses', desc: 'The computer scrambles its memory — use a leaked hint to beat it.' },
  { id: 'rit-rop', title: '05: Baby\'s First ROP', desc: 'Bypass the final defense by jumping to code that already exists.' },
];

export default function ImagineRitPage() {
  const router = useRouter();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCompleted(loadProgress());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const doneCount = EXERCISES.filter(ex => completed.has(ex.id)).length;
  const nextExercise = EXERCISES.find((exercise) => !completed.has(exercise.id)) ?? EXERCISES[0];

  return (
    <div style={{
      gridColumn: '1 / -1',
      gridRow: '1 / -1',
      width: '100%',
      margin: 0,
      padding: 'var(--padding-sm)',
      minHeight: 0,
      overflowY: 'auto',
      fontFamily: 'var(--font-sans)',
      color: 'var(--text)',
    }}>
      <section style={{
        display: 'grid',
        gap: '1rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))',
        marginBottom: '0.75rem',
      }}>
        <div style={{
          padding: '0.85rem',
          border: '1px solid var(--panel-border)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-panel-strong)',
          boxShadow: 'var(--shadow-md)',
          backdropFilter: 'blur(18px)',
        }}>
          <div style={{ color: 'var(--accent-secondary)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Presented At Imagine RIT
          </div>
          <h1 style={{ color: 'var(--text)', fontSize: 'clamp(2rem, 4vw, 3.2rem)', lineHeight: '1.05', marginBottom: '0.85rem', fontFamily: 'var(--font-display)' }}>
            A First Look at Binary Exploitation
          </h1>
          <p style={{ color: 'var(--text)', fontSize: '1rem', lineHeight: '1.7', maxWidth: '60ch', marginBottom: '1rem' }}>
            This track is meant for people arriving at the Imagine RIT event, RITSEC workshops, or simple curiosity who want a first pass through stack overflows and exploit thinking without needing a full reverse-engineering setup first.
          </p>
          <p style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: '1.7', maxWidth: '60ch', marginBottom: '1.25rem' }}>
            VRIG, the Vulnerability Research Interest Group, is part of RITSEC and is presenting this workshop using the interactive visual environment here. It lets you see the code, stack state, console output, and helper tools in one place while the lesson walks you through what is happening. If you want the broader context, you can find VRIG at{' '}
            <a href="https://vri.group/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-secondary)' }}>vri.group</a>
            {' '}and RITSEC at{' '}
            <a href="https://ritsec.club" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-secondary)' }}>ritsec.club</a>.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <button className="link-button secondary-accent" onClick={() => router.push('/demo')}>Try the 1-minute demo</button>
            <button
              className="link-button primary"
              onClick={() => router.push(`/imagine-rit/${nextExercise.id}`)}
            >
              {doneCount > 0 ? 'Continue Workshop' : 'Start Workshop'}
            </button>
            <button
              className="link-button secondary"
              onClick={() => router.push('/')}
            >
              Open Main Lab
            </button>
          </div>
        </div>

        <div style={{
          padding: '0.85rem',
          border: '1px solid var(--panel-border)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-panel)',
          boxShadow: 'var(--shadow-md)',
          backdropFilter: 'blur(18px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1rem',
        }}>
          <div>
            <div style={{ color: 'var(--text)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              What to Expect
            </div>
            <div style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: '1.7' }}>
              6 guided exercises
            </div>
            <div style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: '1.7' }}>
              No prior exploitation experience required
            </div>
            <div style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: '1.7' }}>
              Visual stack and control-flow feedback
            </div>
            <div style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: '1.7' }}>
              Roughly 35 to 50 minutes total
            </div>
          </div>

          <div style={{
            padding: '0.85rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--panel-border)',
          }}>
            <div style={{ color: 'var(--text)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Progress
            </div>
            <div style={{ color: 'var(--text)', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              {doneCount}/{EXERCISES.length}
            </div>
            <div style={{ color: 'var(--text)', fontSize: '0.95rem' }}>
              {'█'.repeat(doneCount)}{'░'.repeat(EXERCISES.length - doneCount)}
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '0.75rem' }}>
        <div style={{ color: 'var(--text)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
          RITSEC + VRIG
        </div>
        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))' }}>
          {[
            {
              title: 'RITSEC context',
              text: 'RITSEC is the broader student security organization behind the workshop. It runs student-focused security events, CTFs, and workshops, and you can find more at https://ritsec.club.',
            },
            {
              title: 'What VRIG does',
              text: 'VRIG stands for Vulnerability Research Interest Group. It is part of RITSEC, and this is the group presenting the workshop at Imagine RIT. The broader VRIG project lives at https://vri.group/.',
            },
            {
              title: 'Why this format works',
              text: 'Instead of asking you to memorize jargon first, the exercises introduce one concept at a time and let you see the effect immediately.',
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                padding: '0.85rem',
                border: '1px solid var(--panel-border)',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255,255,255,0.025)',
              }}
            >
              <div style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                {item.title}
              </div>
              <div style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: '1.7' }}>
                {item.text}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div style={{ color: 'var(--text)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
          Workshop Path
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {EXERCISES.map((ex, i) => {
          const done = completed.has(ex.id);
          const isNext = !done && EXERCISES.slice(0, i).every(e => completed.has(e.id));
          return (
            <div
              key={ex.id}
              onClick={() => router.push(`/imagine-rit/${ex.id}`)}
              style={{
                padding: '0.85rem',
                border: `1px solid ${isNext ? 'var(--accent)' : 'var(--panel-border)'}`,
                borderRadius: 'var(--radius-md)',
                background: done ? 'rgba(109, 226, 213, 0.08)' : 'rgba(255,255,255,0.025)',
                cursor: 'pointer',
                opacity: 1,
              }}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Lesson {i + 1}
              </div>
              <div style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 700, marginBottom: '0.3rem' }}>
                {done && <span style={{ color: 'var(--accent-secondary)', marginRight: '0.5rem' }}>✓</span>}
                {isNext && <span style={{ color: 'var(--accent)', marginRight: '0.5rem' }}>→</span>}
                {ex.title}
              </div>
              <div style={{ fontSize: '0.95rem', color: 'var(--text)', lineHeight: '1.65' }}>{ex.desc}</div>
            </div>
          );
        })}
        </div>
      </section>

      {doneCount === EXERCISES.length && (
        <div style={{
          marginTop: '0.75rem',
          padding: '0.85rem',
          border: '1px solid var(--accent-secondary)',
          textAlign: 'center',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(109, 226, 213, 0.08)',
        }}>
          <div style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Workshop Complete!
          </div>
          <div style={{ fontSize: '0.95rem', color: 'var(--text)', lineHeight: '1.65' }}>
            You learned how buffer overflows work, hijacked program execution, bypassed ASLR, and built a ROP chain. Nice work!
          </div>
          <div style={{ marginTop: '0.9rem' }}>
            <button
              className="link-button secondary-accent"
              onClick={() => router.push('/imagine-rit/congratulations')}
            >
              View Thank You Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
