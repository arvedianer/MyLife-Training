// localStorage Adapter — mirrors MMKV API

export const storage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage full — silently fail
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  },
};

// Zustand persist storage adapter
export const zustandStorage = {
  getItem: (name: string) => {
    const value = storage.getItem(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    storage.setItem(name, value);
  },
  removeItem: (name: string) => {
    storage.removeItem(name);
  },
};
