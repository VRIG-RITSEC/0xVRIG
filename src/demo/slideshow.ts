import { DemoInput, symbolsFor, withDestination } from './challenges';

export const LOOP_DURATIONS = [30, 45, 60] as const;
export type LoopDuration = typeof LOOP_DURATIONS[number];
export const DEFAULT_LOOP_DURATION: LoopDuration = 45;

export const SLIDES = [
  { id: 'name', start: 0, title: 'It starts with a name.', description: 'The program has 16 bytes for a name. Each letter fills one slot. A short name fits safely inside the buffer.' },
  { id: 'overflow', start: 0.22, title: 'Too much input spills over.', description: 'There’s no length check. After 16 bytes, the extra letters overwrite saved data. Keep going and they reach the return address.' },
  { id: 'crash', start: 0.45, title: 'The program crashes.', description: 'The return address tells the program where to go next. Our extra letters replaced it with an invalid address.' },
  { id: 'repair', start: 0.59, title: 'Give the overflow a destination.', description: 'Keep 20 bytes of padding, then replace the next 4 bytes with the address of admin(). Now the input has the right shape.' },
  { id: 'admin', start: 0.78, title: 'Guest becomes admin.', description: 'The same bug that caused the crash now redirects execution. The program calls its admin function instead of returning normally.' },
] as const;

const NAME = 'Taylor';
const LONG_NAME = NAME.padEnd(24, '!');

export function slideshowFrame(elapsedMs: number, duration: LoopDuration, reducedMotion = false) {
  const cycleMs = duration * 1000;
  const position = ((elapsedMs % cycleMs) + cycleMs) % cycleMs;
  const fraction = position / cycleMs;
  const index = SLIDES.findIndex((_, i) => fraction < (SLIDES[i + 1]?.start ?? 1));
  const slide = SLIDES[index];
  const nextStart = SLIDES[index + 1]?.start ?? 1;
  const stageProgress = (fraction - slide.start) / (nextStart - slide.start);
  let input: DemoInput = { text: NAME, ending: null, requested: 8 };
  if (slide.id === 'name') input.text = reducedMotion ? NAME : NAME.slice(0, Math.floor(Math.min(1, stageProgress * 2) * NAME.length));
  if (slide.id === 'overflow') input.text = reducedMotion ? LONG_NAME : LONG_NAME.slice(0, NAME.length + Math.floor(stageProgress * (LONG_NAME.length - NAME.length)));
  if (slide.id === 'crash') input.text = LONG_NAME;
  if (slide.id === 'repair' || slide.id === 'admin') {
    input.text = LONG_NAME.slice(0, 20);
    if (slide.id === 'admin' || stageProgress >= 0.4 || reducedMotion) input = withDestination(input, symbolsFor('overflow', 0x1000).admin);
  }
  return { slide, index, input, fraction, stageProgress, secondsLeft: Math.ceil((cycleMs - position) / 1000) };
}
