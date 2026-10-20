"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listFavoritePage } from "@/lib/social-client";
import { ghostResult, type GhostResult } from "@/lib/result-models";

/**
 * Saved Matchups as full result cards, newest saved first. The favorites route returns the
 * cards themselves; rows unsaved while the list is open stay until it is left, so an
 * accidental unsave is one tap to undo.
 */
export function useSavedMatchups({ enabled, query }: { enabled: boolean; query: string }) {
  const [items, setItems] = useState<GhostResult[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = useRef<AbortController | null>(null);

  const fetchPage = useCallback(async (after: string | null) => {
    active.current?.abort();
    const controller = (active.current = new AbortController());
    try {
      const page = await listFavoritePage(after, controller.signal);
      if (controller.signal.aborted) return;
      const cards = page.items.flatMap((item) => ghostResult(item) ?? []);
      setItems((previous) => (after ? [...previous, ...cards] : cards));
      setCursor(page.nextCursor);
      setLoaded(true);
      setError(null);
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Could not load saved matchups");
    } finally {
      if (active.current === controller) {
        active.current = null;
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void fetchPage(null);
    return () => {
      active.current?.abort();
      active.current = null;
      setItems([]);
      setCursor(null);
      setLoaded(false);
      setError(null);
    };
  }, [enabled, fetchPage]);

  const ghostResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter(
      (card) =>
        !needle ||
        card.username.toLowerCase().includes(needle) ||
        card.streamer_display_name.toLowerCase().includes(needle),
    );
  }, [items, query]);

  return {
    ghostResults,
    isLoading: enabled && !loaded && !error,
    isEmpty: enabled && loaded && items.length === 0 && cursor === null,
    hasMore: cursor !== null,
    isLoadingMore: loadingMore,
    error,
    loadMore: () => {
      if (!cursor || active.current) return;
      setLoadingMore(true);
      void fetchPage(cursor);
    },
    retry: () => {
      setError(null);
      void fetchPage(cursor && loaded ? cursor : null);
    },
  };
}
