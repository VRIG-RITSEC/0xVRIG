import { describe, expect, it } from 'vitest';
import { evaluateStack } from '../challenges';
import { LOOP_DURATIONS, slideshowFrame } from '../slideshow';

describe('unattended buffer overflow slideshow', () => {
  it.each(LOOP_DURATIONS)('shows a safe name, overflow, crash, repair, and admin in a %is loop', duration => {
    const at = (fraction: number) => slideshowFrame(fraction * duration * 1000, duration);
    expect(at(0).slide.id).toBe('name');
    expect(at(0).input.text).toBe('');
    const safe = at(0.18);
    expect(safe.input.text).toBe('Taylor');
    expect(evaluateStack('overflow', safe.input, 0x1000).outcome).toBe('normal');
    const growing = at(0.4);
    expect(growing.slide.id).toBe('overflow');
    expect(growing.input.text.length).toBeGreaterThan(16);
    const crashed = at(0.5);
    expect(crashed.slide.id).toBe('crash');
    expect(evaluateStack('overflow', crashed.input, 0x1000).outcome).toBe('crash');
    const repair = at(0.7);
    expect(repair.slide.id).toBe('repair');
    expect(repair.input.text).toHaveLength(20);
    expect(evaluateStack('overflow', repair.input, 0x1000).outcome).toBe('success');
    const admin = at(0.9);
    expect(admin.slide.id).toBe('admin');
    expect(evaluateStack('overflow', admin.input, 0x1000).outcome).toBe('success');
    expect(slideshowFrame(duration * 1000, duration)).toEqual(slideshowFrame(0, duration));
    expect(slideshowFrame(duration * 3000 + 1500, duration)).toEqual(slideshowFrame(1500, duration));
  });

  it('skips letter-by-letter animation for reduced-motion preferences', () => {
    expect(slideshowFrame(0, 45, true).input.text).toBe('Taylor');
    const overflow = slideshowFrame(0.23 * 45000, 45, true);
    expect(overflow.slide.id).toBe('overflow');
    expect(overflow.input.text).toHaveLength(24);
    expect(evaluateStack('overflow', overflow.input, 0x1000).outcome).toBe('crash');
  });
});
