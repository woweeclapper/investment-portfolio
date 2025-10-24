const CURRENT_VERSION = 2;

// Generic safe load
export function loadData<T>(key: string, fallback: T, version = CURRENT_VERSION): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed._v !== version) {
      // TODO: add migration logic if needed
      return fallback;
    }
    return parsed.data as T;
  } catch {
    return fallback;
  }
}

// Generic safe save
export function saveData<T>(key: string, data: T, version = CURRENT_VERSION) {
  localStorage.setItem(key, JSON.stringify({ _v: version, data }));
}

// 🔹 Typed confirm flags
export type ConfirmFlags = {
  crypto: boolean;
  stocks: boolean;
  dividends: boolean;
};

const DEFAULT_FLAGS: ConfirmFlags = {
  crypto: false,
  stocks: false,
  dividends: false,
};

// Save confirm flags (merge with defaults)
export function saveConfirmFlags(flags: Partial<ConfirmFlags>) {
  const merged = { ...DEFAULT_FLAGS, ...flags };
  localStorage.setItem('confirmFlags', JSON.stringify(merged));
}

// Load confirm flags safely
export function loadConfirmFlags(): ConfirmFlags {
  try {
    const raw = localStorage.getItem('confirmFlags');
    if (!raw) return DEFAULT_FLAGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_FLAGS, ...parsed };
  } catch {
    return DEFAULT_FLAGS;
  }
}

// 🔹 Reset all confirmations at once
export function restoreAllConfirmations() {
  saveConfirmFlags(DEFAULT_FLAGS);
}
