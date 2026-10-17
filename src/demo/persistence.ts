import { DEMO_IDS, DemoId, DemoInput, initialDraft, isDemoId, MAX_PAYLOAD_TEXT_BYTES, textBytes } from './challenges';

export const DEMO_STORAGE_KEY = '0xvrig-demo-v2';
const LEGACY_STORAGE_KEY = '0xvrig-demo-v1';

export interface DemoProgress {
  version: 2;
  current: DemoId;
  completed: DemoId[];
  offset: number;
  drafts: Record<DemoId, ReturnType<typeof initialDraft>>;
}

type DemoStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function createDemoProgress(offset: number): DemoProgress {
  return {
    version: 2,
    current: 'overflow',
    completed: [],
    offset,
    drafts: { overflow: initialDraft('overflow'), addresses: initialDraft('addresses'), counter: initialDraft('counter') },
  };
}

function readInput(value: unknown, legacy: boolean): DemoInput | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  if (!(input.ending === null || (typeof input.ending === 'number' && Number.isInteger(input.ending) && input.ending >= 0 && input.ending <= 0xffffffff))
    || typeof input.requested !== 'number' || !Number.isInteger(input.requested) || input.requested < 0 || input.requested > 255) return null;
  let text: string;
  if (legacy) {
    if (typeof input.letters !== 'number' || !Number.isInteger(input.letters) || input.letters < 0 || input.letters > 24 || input.letters % 4 !== 0) return null;
    text = 'A'.repeat(input.letters);
  } else {
    if (typeof input.text !== 'string' || input.text.length > MAX_PAYLOAD_TEXT_BYTES || textBytes(input.text).length > MAX_PAYLOAD_TEXT_BYTES) return null;
    text = input.text;
  }
  return { text, ending: input.ending, requested: input.requested };
}

export function readDemoProgress(storage: DemoStorage): DemoProgress | null {
  try {
    const raw = storage.getItem(DEMO_STORAGE_KEY) ?? storage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (!value || (value.version !== 1 && value.version !== 2) || !isDemoId(value.current) || !Array.isArray(value.completed)
      || !Number.isInteger(value.offset) || value.offset < 0x1000 || value.offset > 0x1ff000 || value.offset % 0x1000 !== 0) return null;
    const progress = createDemoProgress(value.offset);
    progress.current = value.current;
    progress.completed = [...new Set<DemoId>(value.completed.filter(isDemoId))];
    for (const id of DEMO_IDS) {
      const draft = value.drafts?.[id];
      const input = readInput(draft, value.version === 1);
      const lastRun = draft?.lastRun === null ? null : readInput(draft?.lastRun, value.version === 1);
      if (input && typeof draft.crashed === 'boolean' && (draft.lastRun === null || lastRun)) {
        progress.drafts[id] = { ...input, crashed: draft.crashed, lastRun };
      }
    }
    return progress;
  } catch {
    return null;
  }
}

export function writeDemoProgress(storage: DemoStorage, progress: DemoProgress): boolean {
  try {
    storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}
