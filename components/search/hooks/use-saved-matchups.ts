"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cachedGet } from "@/lib/api-cache";
import { ghostResult, type GhostResult } from "@/lib/result-models";
import { useBookmarkIds } from "@/components/social/bookmarks-provider";

const CONCURRENCY = 8;
const PAGE = 50;

/** Adapter seam: swap for the batch endpoint (KAI-68) without touching the hook. */
async function fetchMatchups(ids: number[], signal: AbortSignal) {
  return Promise.all(ids.map(async (id) => {
    try {
      return [id, ghostResult((await cachedGet(`/matchups/${id}`, {}, { signal })).matchup)] as const;
    } catch {
      return [id, null] as const;
    }
  }));
}

/**
 * Saved matchups as full result cards. The favorites route returns bare clips, so each
 * is resolved through the public matchup route (cached per ID). Rows removed while the
 * list is open stay until it is left, so an accidental unsave is one tap to undo.
 */
export function useSavedMatchups({ enabled, query }: { enabled: boolean; query: string }) {
  const ids = useBookmarkIds(enabled);
  const [shown, setShown] = useState<number[]>([]);
  const [cards, setCards] = useState<Map<number, GhostResult | null>>(new Map());
  const requested = useRef(new Set<number>());
  const failed = useRef(new Set<number>());
  const abort = useRef<AbortController | null>(null);
  const [limit, setLimit] = useState(PAGE);

  useEffect(() => {
    if (!enabled) {
      setShown([]);
      return;
    }
    if (!ids) return;
    setShown((current) => {
      const known = new Set(current);
      const added = ids.filter((id) => !known.has(id));
      return added.length ? [...added, ...current] : current;
    });
  }, [enabled, ids]);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    abort.current = controller;
    return () => {
      controller.abort();
      requested.current.clear();
      failed.current.clear();
    };
  }, [enabled]);

  useEffect(() => {
    const signal = abort.current?.signal;
    const todo = shown.slice(0, limit).filter((id) => !requested.current.has(id));
    if (!todo.length || !signal) return;
    todo.forEach((id) => requested.current.add(id));
    (async () => {
      for (let i = 0; i < todo.length; i += CONCURRENCY) {
        const batch = await fetchMatchups(todo.slice(i, i + CONCURRENCY), signal);
        if (signal.aborted) return;
        batch.forEach(([id, card]) => { if (!card) failed.current.add(id); });
        setCards((current) => new Map([...current, ...batch.filter(([, card]) => card)]));
      }
    })();
  }, [shown, limit, enabled]);

  const ghostResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return shown
      .slice(0, limit)
      .map((id) => cards.get(id))
      .filter((card): card is GhostResult => !!card)
      .filter(
        (card) =>
          !needle ||
          card.username.toLowerCase().includes(needle) ||
          card.streamer_display_name.toLowerCase().includes(needle),
      );
  }, [shown, cards, query, limit]);

  const isLoading = enabled && (ids === null || shown.slice(0, limit).some((id) => !cards.has(id) && !failed.current.has(id)) && ghostResults.length === 0);
  return { ghostResults, isLoading, isEmpty: enabled && ids !== null && shown.length === 0,
    hasMore: shown.length > limit, loadMore: () => setLimit((n) => n + PAGE) };
}
