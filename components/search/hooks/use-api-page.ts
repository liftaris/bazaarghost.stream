"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { cachedGet, invalidate, peek } from "@/lib/api-cache";
import type { PublicRoutes } from "@/lib/api-contract";

type ListPath = "/search" | "/videos" | "/creators";
type Item<P extends ListPath> = PublicRoutes[P]["items"][number];

/** Cursor pagination with cancellation, bounded refresh, and visible retryable errors. */
export function useApiPage<P extends ListPath>(path: P, params: Record<string, string | number | boolean | null>, enabled = true) {
  const key = JSON.stringify([path, params]);
  const [items, setItems] = useState<Item<P>[]>([]);
  const [itemsKey, setItemsKey] = useState(key);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = useRef<AbortController | null>(null);
  const currentKey = useRef(key); currentKey.current = key;
  const fetchPage = useCallback(async (after: string | null = null) => {
    active.current?.abort();
    const controller = new AbortController(); active.current = controller;
    const [route, filters] = JSON.parse(key) as [P, typeof params];
    setError(null); if (after) setLoadingMore(true); else setLoading(true);
    try {
      let response;
      try { response = await cachedGet(route, { ...filters, cursor: after, limit: 50 }, { signal: controller.signal }); }
      catch (error) {
        if (!(error instanceof ApiError) || error.status !== 409) throw error;
        after = null; invalidate(`${route}?`); // one restart only; a second 409 surfaces as an error
        response = await cachedGet(route, { ...filters, cursor: null, limit: 50 }, { signal: controller.signal });
      }
      if (controller.signal.aborted || currentKey.current !== key) return;
      const next = response.items as Item<P>[];
      setItems(previous => after ? [...previous, ...next] : next); setItemsKey(key); setCursor(response.nextCursor);
    } catch (error) {
      if (!controller.signal.aborted && currentKey.current === key) setError(error instanceof Error ? error.message : "Could not load results");
    } finally {
      if (active.current === controller) { setLoading(false); setLoadingMore(false); active.current = null; }
    }
  }, [key]);
  useEffect(() => {
    setError(null);
    if (!enabled) { setItems([]); setCursor(null); return; }
    const [route, filters] = JSON.parse(key) as [P, typeof params];
    const hit = peek(route, { ...filters, cursor: null, limit: 50 });
    if (hit) { setItems(hit.items as Item<P>[]); setCursor(hit.nextCursor); setItemsKey(key); }
    else setCursor(null);
    void fetchPage();
    return () => { active.current?.abort(); active.current = null; };
  }, [fetchPage, enabled]);
  return { items, isStale: itemsKey !== key && items.length > 0, loading, loadingMore, error, hasMore: cursor !== null,
    loadMore: () => { if (cursor && !active.current) void fetchPage(cursor); },
    retry: () => { active.current?.abort(); active.current = null; invalidate(`${path}?`); void fetchPage(items.length && itemsKey === key ? cursor : null); } };
}
