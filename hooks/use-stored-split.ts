"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { splitRatio } from "@/lib/session-navigation";

/** Versioned client-only ratio persistence; unavailable storage leaves a functional local split. */
export function useStoredSplit(name: string, initial: number) {
  const key = `bazaarghost:split:v1:${name}`;
  const [ratio, setRatio] = useState(initial);
  const live = useRef(initial);
  const change = useCallback((next: number) => {
    live.current = next;
    setRatio(next);
  }, []);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        const value = splitRatio(JSON.parse(saved), initial);
        live.current = value;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- client storage cannot be read during SSR hydration
        setRatio(value);
      }
    } catch {
      /* Disabled storage or an invalid prior value uses the default. */
    }
  }, [key, initial]);
  const commit = useCallback(() => {
    try {
      localStorage.setItem(key, JSON.stringify(live.current));
    } catch {
      /* Optional preference only. */
    }
  }, [key]);
  return {
    ratio,
    change,
    commit,
    restore: () => {
      change(initial);
      try {
        localStorage.setItem(key, JSON.stringify(initial));
      } catch {
        /* Optional. */
      }
    },
  };
}
