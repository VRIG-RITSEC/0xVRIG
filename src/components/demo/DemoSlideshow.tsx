'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { evaluateStack, payloadFor } from '@/demo/challenges';
import { DEFAULT_LOOP_DURATION, LOOP_DURATIONS, LoopDuration, SLIDES, slideshowFrame } from '@/demo/slideshow';
import { hex2 } from '@/engine/helpers';
import Confetti from './Confetti';
import MemoryDiagram from './MemoryDiagram';
import styles from './Demo.module.css';

export default function DemoSlideshow() {
  const [duration, setDuration] = useState<LoopDuration>(DEFAULT_LOOP_DURATION);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fullscreenMessage, setFullscreenMessage] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const screen = useRef<HTMLElement>(null);
  const frame = slideshowFrame(elapsed, duration, reducedMotion);
  const result = evaluateStack('overflow', frame.input, 0x1000);
  const phase = frame.slide.id;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const rebase = () => { last = performance.now(); };
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = now - last;
      last = now;
      if (!document.hidden) setElapsed(previous => previous + delta);
    }, 100);
    document.addEventListener('visibilitychange', rebase);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', rebase); };
  }, [playing]);

  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === screen.current);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await screen.current?.requestFullscreen();
      setFullscreenMessage('');
    } catch {
      setFullscreenMessage('Fullscreen is unavailable in this browser. You can still use the slideshow in this window.');
    }
  }

  function moveTo(index: number) {
    setPlaying(false);
    setElapsed(SLIDES[index].start * duration * 1000);
  }

  return <main id="demo-content" ref={screen} className={styles.showroom} data-phase={phase}>
    {phase === 'admin' && result.outcome === 'success' && <Confetti />}
    <div className={styles.windowTitle}><span>0xVRIG — BUFFER_OVERFLOW.SCR</span><span className={styles.windowControls} aria-hidden="true">— □ ×</span></div>
    <div className={styles.showroomBody}>
      <div className={styles.showroomHeading}><div><h1>A long name. An unexpected admin.</h1><p>Watch a buffer overflow happen, then try it on your phone.</p></div><span className={styles.autoplayLabel}>{playing ? 'Playing automatically' : 'Paused'}</span></div>
      <div className={styles.slideshowGrid}>
        <section className={styles.activity} aria-label="Animated program memory">
          <div className={styles.programHeader}><span>vulnerable.exe</span><span className={`${styles.role} ${phase === 'admin' ? styles.adminRole : phase === 'crash' ? styles.crashedRole : ''}`}>{phase === 'admin' ? 'Admin' : phase === 'crash' ? 'Crashed' : 'Guest'}</span></div>
          <div className={styles.autoPayload}><span>Name input</span><code>{frame.input.text || '…'}</code>{frame.input.ending !== null && <small>+ admin address: {payloadFor(frame.input).slice(20).map(hex2).join(' ')}</small>}</div>
          <MemoryDiagram input={frame.input} />
        </section>
        <div className={styles.narrationColumn}>
          <section className={styles.narration} aria-label="Slideshow explanation">
            <div className={styles.windowTitle}>{frame.index + 1} of {SLIDES.length} — What’s happening?</div>
            <div className={styles.narrationBody}>
              <h2>{frame.slide.title}</h2><p>{frame.slide.description}</p>
              {phase === 'crash' && <div className={styles.errorDialog}><div className={styles.windowTitle}>Application Error</div><p><span className={styles.errorIcon} aria-hidden="true">×</span> Invalid return address. The program cannot continue.</p></div>}
              {phase === 'admin' && result.outcome === 'success' && <div className={styles.adminDialog}><strong>✓ Admin access granted</strong><span>You controlled where the program went next.</span></div>}
            </div>
          </section>
          <aside className={styles.qrPanel} aria-label="Try the interactive demo">
            <Image src={`${process.env.NODE_ENV === 'production' ? '/0xVRIG' : ''}/demo-qr.svg`} width={176} height={176} alt="QR code for the one-minute interactive demo" unoptimized />
            <div><h2>Your turn.</h2><p>Scan to crash it, fix it, and become admin.</p><Link href="/demo">Try the one-minute demo →</Link><span className={styles.qrUrl}>vrig-ritsec.github.io/0xVRIG/demo</span></div>
          </aside>
        </div>
      </div>
      <div className={styles.playbackControls} aria-label="Slideshow controls">
        <button type="button" onClick={() => setPlaying(previous => !previous)}>{playing ? 'Pause' : 'Play'}</button>
        <button type="button" onClick={() => setElapsed(0)}>Restart</button>
        <label>Loop length <select value={duration} onChange={event => { setDuration(Number(event.target.value) as LoopDuration); setElapsed(0); }}>{LOOP_DURATIONS.map(seconds => <option key={seconds} value={seconds}>{seconds} seconds</option>)}</select></label>
        <button type="button" onClick={toggleFullscreen}>{fullscreen ? 'Exit fullscreen' : 'Fullscreen'}</button>
      </div>
      <div className={styles.slideTimeline} role="progressbar" aria-label="Progress through the loop" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.floor(frame.fraction * 100)}><span style={{ width: `${frame.fraction * 100}%` }} /></div>
      <nav className={styles.slideSteps} aria-label="Jump to a slide">{SLIDES.map((slide, index) => <button type="button" key={slide.id} aria-current={index === frame.index ? 'step' : undefined} onClick={() => moveTo(index)}>{index + 1}. {['Name', 'Overflow', 'Crash', 'Repair', 'Admin'][index]}</button>)}</nav>
      <p className={styles.loopNote}>{playing ? `Repeats in ${frame.secondsLeft}s` : 'Paused · choose a step or press Play to continue'} · No interaction needed</p>
      {fullscreenMessage && <p role="status">{fullscreenMessage}</p>}
    </div>
  </main>;
}
