const STORAGE_KEY = 'memcorr-progress';

export function saveProgress(completed: Set<string>): void {
  try {
    const arr = Array.from(completed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {
    // localStorage may not be available (SSR, private mode, etc.)
  }
}

export function loadProgress(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr.filter((v): v is string => typeof v === 'string'));
      }
    }
  } catch {
    // localStorage may not be available
  }
  return new Set();
}
