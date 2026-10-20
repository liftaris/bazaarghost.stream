"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useFavoritesFirstPage } from "@/components/social/bookmarks-provider";
import { listFavoritePage } from "@/lib/social-client";
import { ghostResult, type GhostResult } from "@/lib/result-models";

/**
 * Saved Matchups as full result cards, newest saved first. The first page comes from the
 * bookmark store's own request; rows unsaved while the list is open stay until it is left,
 * so an accidental unsave is one tap to undo.
 */
export function useSavedMatchups({ enabled, query }: { enabled: boolean; query: string }) {
  const first = useFavoritesFirstPage();
  const [more, setMore] = useState<{ items: GhostResult[]; cursor: string | null } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);
  const active = useRef<AbortController | null>(null);
  const [seen, setSeen] = useState<{ enabled: boolean; page: unknown }>({ enabled, page: first.page });
  if (seen.enabled !== enabled || seen.page !== first.page) {
    setSeen({ enabled, page: first.page });
    setMore(null);
    setMoreError(null);
  }

  const firstItems = useMemo(() => first.page?.items.flatMap((item) => ghostResult(item) ?? []) ?? [], [first.page]);
  const items = useMemo(() => [...firstItems, ...(more?.items ?? [])], [firstItems, more]);
  const loaded = enabled && first.page !== null;
  const cursor = more ? more.cursor : first.page?.nextCursor ?? null;

  const fetchMore = useCallback(async (after: string) => {
    active.current?.abort();
    const controller = (active.current = new AbortController());
    setLoadingMore(true);
    try {
      const page = await listFavoritePage(after, controller.signal);
      if (controller.signal.aborted) return;
      const cards = page.items.flatMap((item) => ghostResult(item) ?? []);
      setMore((previous) => ({ items: [...(previous?.items ?? []), ...cards], cursor: page.nextCursor }));
      setMoreError(null);
    } catch (failure) {
      if (!controller.signal.aborted) setMoreError(failure instanceof Error ? failure.message : "Could not load saved matchups");
    } finally {
      if (active.current === controller) {
        active.current = null;
        setLoadingMore(false);
      }
    }
  }, []);

  const ghostResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter(
      (card) =>
        !needle ||
        card.username.toLowerCase().includes(needle) ||
        card.streamer_display_name.toLowerCase().includes(needle),
    );
  }, [items, query]);

  const error = moreError ?? (enabled && first.error && !first.page ? "Could not load saved matchups" : null);
  return {
    ghostResults,
    isLoading: enabled && !loaded && !error,
    isEmpty: loaded && items.length === 0 && cursor === null,
    hasMore: cursor !== null,
    isLoadingMore: loadingMore,
    error,
    loadMore: () => {
      if (!cursor || active.current) return;
      void fetchMore(cursor);
    },
    retry: () => {
      if (moreError && cursor) void fetchMore(cursor);
      else first.reload();
    },
  };
}
