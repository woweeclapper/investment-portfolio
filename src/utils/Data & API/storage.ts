const CURRENT_VERSION = 2;

//  Generic safe load
export function loadData<T>(
  key: string,
  fallback: T,
  version = CURRENT_VERSION
): T {
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

//  Generic safe save
export function saveData<T>(key: string, data: T, version = CURRENT_VERSION) {
  localStorage.setItem(key, JSON.stringify({ _v: version, data }));
}

// ----------------------------------------------------
//  Typed confirm flags (UI-only, not in Supabase)
// ----------------------------------------------------
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

const CONFIRM_FLAGS_KEY = 'confirmFlags';

// Save confirm flags (merge with defaults)
export function saveConfirmFlags(flags: Partial<ConfirmFlags>) {
  const merged = { ...DEFAULT_FLAGS, ...flags };
  saveData(CONFIRM_FLAGS_KEY, merged);
}

// Load confirm flags safely
export function loadConfirmFlags(): ConfirmFlags {
  return loadData(CONFIRM_FLAGS_KEY, DEFAULT_FLAGS);
}

// Reset all confirmations at once
export function restoreAllConfirmations() {
  saveConfirmFlags(DEFAULT_FLAGS);
}
