"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiGet } from "@/lib/api-client";
import { ghostResult, type GhostResult } from "@/lib/result-models";
import { useBookmarks } from "@/components/social/bookmarks-provider";

const CONCURRENCY = 8;

/**
 * Saved matchups as full result cards. The favorites route returns bare clips, so each
 * is resolved through the public matchup route (cached per ID). Rows removed while the
 * list is open stay until it is left, so an accidental unsave is one tap to undo.
 */
export function useSavedMatchups({ enabled, query }: { enabled: boolean; query: string }) {
  const { ids } = useBookmarks();
  const [shown, setShown] = useState<number[]>([]);
  const [cards, setCards] = useState<Map<number, GhostResult | null>>(new Map());
  const requested = useRef(new Set<number>());

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
    const todo = shown.filter((id) => !requested.current.has(id));
    if (!todo.length) return;
    todo.forEach((id) => requested.current.add(id));
    let cancelled = false;
    (async () => {
      for (let i = 0; i < todo.length; i += CONCURRENCY) {
        const batch = await Promise.all(
          todo.slice(i, i + CONCURRENCY).map(async (id) => {
            try {
              return [id, ghostResult((await apiGet(`/matchups/${id}`)).matchup)] as const;
            } catch {
              return [id, null] as const;
            }
          }),
        );
        if (cancelled) return;
        setCards((current) => new Map([...current, ...batch]));
      }
    })();
    return () => {
      cancelled = true;
      todo.forEach((id) => requested.current.delete(id));
    };
  }, [shown]);

  const ghostResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return shown
      .map((id) => cards.get(id))
      .filter((card): card is GhostResult => !!card)
      .filter(
        (card) =>
          !needle ||
          card.username.toLowerCase().includes(needle) ||
          card.streamer_display_name.toLowerCase().includes(needle),
      );
  }, [shown, cards, query]);

  const isLoading = enabled && (ids === null || shown.some((id) => !cards.has(id)) && ghostResults.length === 0);
  return { ghostResults, isLoading, isEmpty: enabled && ids !== null && shown.length === 0 };
}
