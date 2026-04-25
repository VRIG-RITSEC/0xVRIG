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

  return (
    <div style={{
      maxWidth: '620px',
      margin: '3rem auto',
      padding: '2rem',
      fontFamily: 'var(--font)',
      color: 'var(--text)',
    }}>
      <h1 style={{ color: 'var(--green)', fontSize: '22px', fontWeight: 'normal', marginBottom: '0.25rem' }}>
        0xVRIG — Imagine RIT
      </h1>
      <p style={{ color: 'var(--text-dim)', fontSize: '13px', marginBottom: '0.5rem' }}>
        Learn how hackers exploit programs — in 5 hands-on exercises
      </p>
      <p style={{ color: 'var(--text-dim)', fontSize: '11px', marginBottom: '2rem' }}>
        No coding experience needed. Each exercise builds on the last.
      </p>

      <div style={{ fontSize: '12px', marginBottom: '1.5rem', color: 'var(--text-dim)' }}>
        Progress: {doneCount}/{EXERCISES.length}{' '}
        <span style={{ color: 'var(--green)' }}>
          {'█'.repeat(doneCount)}{'░'.repeat(EXERCISES.length - doneCount)}
        </span>
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
                padding: '0.75rem 1rem',
                border: `1px solid ${isNext ? 'var(--green)' : 'var(--panel-border)'}`,
                cursor: 'pointer',
                opacity: done ? 0.6 : 1,
              }}
            >
              <div style={{ fontSize: '13px', marginBottom: '0.25rem' }}>
                {done && <span style={{ color: 'var(--green)', marginRight: '0.5rem' }}>✓</span>}
                {isNext && <span style={{ color: 'var(--green)', marginRight: '0.5rem' }}>→</span>}
                {ex.title}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{ex.desc}</div>
            </div>
          );
        })}
      </div>

      {doneCount === EXERCISES.length && (
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          border: '1px solid var(--green)',
          textAlign: 'center',
        }}>
          <div style={{ color: 'var(--green)', fontSize: '14px', marginBottom: '0.25rem' }}>
            Workshop Complete!
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            You learned how buffer overflows work, hijacked program execution, bypassed ASLR, and built a ROP chain. Nice work!
          </div>
        </div>
      )}
    </div>
  );
}
