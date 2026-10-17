import { describe, expect, it } from 'vitest';
import { createDemoProgress, DEMO_STORAGE_KEY, readDemoProgress, writeDemoProgress } from '../persistence';

function memoryStorage() {
  const values = new Map<string, string>([['0xvrig-progress', 'existing workshop progress']]);
  return { values, getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
}

describe('demo progress', () => {
  it('migrates old tap-built attempts without losing completions or the crash stage', () => {
    const storage = memoryStorage();
    const base = createDemoProgress(0x3000);
    storage.setItem('0xvrig-demo-v1', JSON.stringify({
      ...base, version: 1, completed: ['overflow'],
      drafts: { overflow: { letters: 24, ending: null, requested: 8, crashed: true, lastRun: { letters: 20, ending: null, requested: 8 } } },
    }));
    const result = readDemoProgress(storage);
    expect(result?.version).toBe(2);
    expect(result?.completed).toEqual(['overflow']);
    expect(result?.drafts.overflow.text).toBe('A'.repeat(24));
    expect(result?.drafts.overflow.crashed).toBe(true);
    expect(result?.drafts.overflow.lastRun?.text).toBe('A'.repeat(20));
    expect(writeDemoProgress(storage, result!)).toBe(true);
    expect(readDemoProgress(storage)).toEqual(result);
  });

  it('restores an actual typed name and accepts arbitrary byte lengths', () => {
    const storage = memoryStorage();
    const progress = createDemoProgress(0x1000);
    progress.drafts.overflow.text = 'Zoë';
    expect(writeDemoProgress(storage, progress)).toBe(true);
    expect(readDemoProgress(storage)?.drafts.overflow.text).toBe('Zoë');
  });

  it('restores the exact attempt, crash stage, completions, and shuffled address layout', () => {
    const storage = memoryStorage();
    const progress = createDemoProgress(0x35000);
    progress.current = 'addresses';
    progress.completed = ['overflow'];
    progress.drafts.addresses = { text: 'A'.repeat(20), ending: 0x0807d150, requested: 8, crashed: true, lastRun: { text: 'A'.repeat(24), ending: null, requested: 8 } };
    expect(writeDemoProgress(storage, progress)).toBe(true);
    expect(readDemoProgress(storage)).toEqual(progress);
    expect(storage.values.get('0xvrig-progress')).toBe('existing workshop progress');
  });

  it('handles unavailable storage without throwing', () => {
    const storage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('full'); } };
    expect(readDemoProgress(storage)).toBeNull();
    expect(writeDemoProgress(storage, createDemoProgress(0x1000))).toBe(false);
  });

  it.each(['not json', 'null', '{}', '{"version":2}', '{"version":1,"current":"missing"}'])('ignores invalid progress: %s', raw => {
    const storage = memoryStorage();
    storage.setItem(DEMO_STORAGE_KEY, raw);
    expect(readDemoProgress(storage)).toBeNull();
  });

  it('rejects unbounded payload lengths and restores a safe initial draft', () => {
    const storage = memoryStorage();
    const progress = createDemoProgress(0x1000);
    progress.drafts.overflow.text = 'x'.repeat(1000);
    storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(progress));
    expect(readDemoProgress(storage)?.drafts.overflow.text).toBe('');
  });

  it('filters unknown completions, removes duplicates, and rejects invalid randomized offsets', () => {
    const storage = memoryStorage();
    const progress = { ...createDemoProgress(0x1000), completed: ['overflow', 'overflow', 'rit-02', 'unknown'] };
    storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(progress));
    expect(readDemoProgress(storage)?.completed).toEqual(['overflow']);
    storage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ ...progress, offset: 1 }));
    expect(readDemoProgress(storage)).toBeNull();
  });
});
