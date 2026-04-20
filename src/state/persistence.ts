const SCHEMA_VERSION = 2;
const STORAGE_KEY = '0xvrig-progress';
const OLD_KEYS = ['0xvrig-progress-v1', 'memcorr-progress-v2'];

interface StoredProgress {
  version: number;
  completed: string[];
}

export function saveProgress(completed: Set<string>): void {
  try {
    const data: StoredProgress = { version: SCHEMA_VERSION, completed: Array.from(completed) };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* localStorage unavailable */ }
}

export function loadProgress(): Set<string> {
  try {
    for (const oldKey of OLD_KEYS) {
      const oldRaw = localStorage.getItem(oldKey);
      if (oldRaw) {
        const arr = JSON.parse(oldRaw);
        if (Array.isArray(arr)) {
          const migrated: StoredProgress = { version: SCHEMA_VERSION, completed: arr.filter((v): v is string => typeof v === 'string') };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        }
        localStorage.removeItem(oldKey);
      }
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const migrated: StoredProgress = { version: SCHEMA_VERSION, completed: parsed.filter((v): v is string => typeof v === 'string') };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return new Set(migrated.completed);
      }
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.completed)) {
        return new Set(parsed.completed.filter((v: unknown): v is string => typeof v === 'string'));
      }
    }
  } catch { /* localStorage unavailable */ }
  return new Set();
}
