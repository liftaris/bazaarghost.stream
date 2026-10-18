"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { listFavoriteIds, setFavorite } from "@/lib/social-client";

interface BookmarksValue {
  /** Whether bookmarking is offered at all (auth enabled). */
  enabled: boolean;
  signedIn: boolean;
  /** Saved matchup IDs, newest ID first. Null until first loaded. */
  ids: number[] | null;
  has: (id: number) => boolean;
  toggle: (id: number) => Promise<void>;
}

const BookmarksContext = createContext<BookmarksValue | null>(null);

export function BookmarksProvider({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  const [saved, setSaved] = useState<Set<number> | null>(null);
  const pending = useRef(new Set<number>());
  const csrf = state.status === "authenticated" ? state.identity.csrfToken : null;
  const userId = state.status === "authenticated" ? state.identity.userId : null;

  useEffect(() => {
    if (!userId) {
      setSaved(state.status === "loading" ? null : new Set());
      return;
    }
    const controller = new AbortController();
    listFavoriteIds(controller.signal)
      .then((ids) => setSaved(new Set(ids)))
      .catch(() => {
        if (!controller.signal.aborted) setSaved(new Set());
      });
    return () => controller.abort();
  }, [userId, state.status]);

  const toggle = useCallback(
    async (id: number) => {
      if (!csrf || !saved || pending.current.has(id)) return;
      const next = !saved.has(id);
      const apply = (on: boolean) =>
        setSaved((current) => {
          const copy = new Set(current);
          if (on) copy.add(id);
          else copy.delete(id);
          return copy;
        });
      pending.current.add(id);
      apply(next);
      try {
        await setFavorite(id, next, csrf);
      } catch (error) {
        apply(!next);
        toast.error(error instanceof Error ? error.message : "Couldn't save");
      } finally {
        pending.current.delete(id);
      }
    },
    [csrf, saved],
  );

  const value = useMemo<BookmarksValue>(
    () => ({
      enabled: state.status !== "disabled",
      signedIn: state.status === "authenticated",
      ids: saved ? [...saved].sort((a, b) => b - a) : null,
      has: (id) => saved?.has(id) ?? false,
      toggle,
    }),
    [state.status, saved, toggle],
  );

  return <BookmarksContext.Provider value={value}>{children}</BookmarksContext.Provider>;
}

export function useBookmarks() {
  const value = useContext(BookmarksContext);
  if (!value) throw new Error("useBookmarks must be used inside <BookmarksProvider>");
  return value;
}
