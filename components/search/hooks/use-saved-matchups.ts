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
  const [requested] = useState(() => new Set<number>());
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const abort = useRef<AbortController | null>(null);
  const [limit, setLimit] = useState(PAGE);

  // Merge newly bookmarked IDs to the front; leaving the view clears the list
  const [seen, setSeen] = useState<{ enabled: boolean; ids: number[] | null }>({ enabled: false, ids: null });
  if (seen.enabled !== enabled || seen.ids !== ids) {
    setSeen({ enabled, ids });
    if (seen.enabled !== enabled) setFailed(new Set());
    if (!enabled) setShown([]);
    else if (ids) {
      setShown((current) => {
        const known = new Set(current);
        const added = ids.filter((id) => !known.has(id));
        return added.length ? [...added, ...current] : current;
      });
    }
  }

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    abort.current = controller;
    return () => {
      controller.abort();
      requested.clear();
    };
  }, [enabled, requested]);

  useEffect(() => {
    const signal = abort.current?.signal;
    const todo = shown.slice(0, limit).filter((id) => !requested.has(id));
    if (!todo.length || !signal) return;
    todo.forEach((id) => requested.add(id));
    (async () => {
      for (let i = 0; i < todo.length; i += CONCURRENCY) {
        const batch = await fetchMatchups(todo.slice(i, i + CONCURRENCY), signal);
        if (signal.aborted) return;
        const misses = batch.filter(([, card]) => !card).map(([id]) => id);
        if (misses.length) setFailed((current) => new Set([...current, ...misses]));
        setCards((current) => new Map([...current, ...batch.filter(([, card]) => card)]));
      }
    })();
  }, [shown, limit, enabled, requested]);

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

  const pending = shown.slice(0, limit).some((id) => !cards.has(id) && !failed.has(id));
  const isLoading = enabled && (ids === null || (pending && ghostResults.length === 0));
  // Cards from an earlier visit stay up (dimmed) while newly saved ones resolve
  const isStale = enabled && ghostResults.length > 0 && shown.slice(0, PAGE).some((id) => !cards.has(id) && !failed.has(id));
  return { ghostResults, isLoading, isStale, isEmpty: enabled && ids !== null && shown.length === 0,
    hasMore: shown.length > limit, loadMore: () => setLimit((n) => n + PAGE) };
}
