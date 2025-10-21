const CURRENT_VERSION = 2;

export function loadData<T>(key: string, fallback: T, version = CURRENT_VERSION): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed._v !== version) {
      // migrate or reset
      return fallback;
    }
    return parsed.data;
  } catch {
    return fallback;
  }
}

export function saveData<T>(key: string, data: T, version = CURRENT_VERSION) {
  localStorage.setItem(key, JSON.stringify({ _v: version, data }));
}

export function saveConfirmFlags(flags: Record<string, boolean>) {
  localStorage.setItem('confirmFlags', JSON.stringify(flags));
}

export function loadConfirmFlags(): Record<string, boolean> {
  return JSON.parse(localStorage.getItem('confirmFlags') || '{}');
}
