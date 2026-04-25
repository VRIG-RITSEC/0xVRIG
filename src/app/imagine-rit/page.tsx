'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadProgress } from '@/state/persistence';

const EXERCISES = [
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
      maxWidth: '960px',
      margin: '2.5rem auto 4rem',
      padding: '2rem',
      fontFamily: 'var(--font-sans)',
      color: 'var(--text)',
    }}>
      <section style={{
        display: 'grid',
        gap: '1rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))',
        marginBottom: '1.75rem',
      }}>
        <div style={{
          padding: '1.5rem',
          border: '1px solid var(--panel-border)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-panel-strong)',
          boxShadow: 'var(--shadow-md)',
          backdropFilter: 'blur(18px)',
        }}>
          <div style={{ color: 'var(--accent-secondary)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Beginner Workshop
          </div>
          <h1 style={{ color: 'var(--text)', fontSize: 'clamp(2rem, 4vw, 3.2rem)', lineHeight: '1.05', marginBottom: '0.85rem', fontFamily: 'var(--font-display)' }}>
            Imagine RIT teaches binary exploitation without assuming you already know systems.
          </h1>
          <p style={{ color: 'var(--text)', fontSize: '1rem', lineHeight: '1.7', maxWidth: '60ch', marginBottom: '1rem' }}>
            This track is for people who are curious about memory corruption, overflows, and exploit chains but have never touched a debugger or written an exploit before. Each exercise is short, guided, and visual.
          </p>
          <p style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: '1.7', maxWidth: '60ch', marginBottom: '1.25rem' }}>
            You will see how programs store data, what goes wrong when inputs are too large, how control flow gets hijacked, and how attackers work around modern defenses.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
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
              Explore Full 0xVRIG
            </button>
          </div>
        </div>

        <div style={{
          padding: '1.25rem',
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
              5 guided exercises
            </div>
            <div style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: '1.7' }}>
              No prior exploitation experience required
            </div>
            <div style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: '1.7' }}>
              Visual stack and control-flow feedback
            </div>
            <div style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: '1.7' }}>
              Roughly 30 to 45 minutes total
            </div>
          </div>

          <div style={{
            padding: '1rem',
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

      <section style={{ marginBottom: '1.75rem' }}>
        <div style={{ color: 'var(--text)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
          Why this exists
        </div>
        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))' }}>
          {[
            {
              title: 'No jargon wall',
              text: 'The exercises explain what the stack, return address, and payload are while you use them.',
            },
            {
              title: 'Short feedback loops',
              text: 'You can try an input, see the visual effect immediately, and iterate without needing a separate setup.',
            },
            {
              title: 'Builds confidence',
              text: 'Each lesson introduces one idea, then carries it into the next exercise instead of throwing everything at you at once.',
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                padding: '1rem 1.1rem',
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
                padding: '1rem 1.1rem',
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
          marginTop: '2rem',
          padding: '1.1rem 1.2rem',
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
        </div>
      )}
    </div>
  );
}
