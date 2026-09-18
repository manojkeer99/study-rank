import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initial: T | (() => T)) {
  const [value, setValue] = useState<T>(() => {
    const base = typeof initial === "function" ? (initial as () => T)() : initial;
    try {
      const raw = localStorage.getItem(key);
      if (raw) return { ...base, ...JSON.parse(raw) } as T;
    } catch {
      /* ignore malformed storage */
    }
    return base;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage may be unavailable */
    }
  }, [key, value]);

  return [value, setValue] as const;
}
