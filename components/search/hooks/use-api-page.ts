"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, apiGet } from "@/lib/api-client";
import type { PublicRoutes } from "@/lib/api-contract";

type ListPath = "/search" | "/videos" | "/creators";
type Item<P extends ListPath> = PublicRoutes[P]["items"][number];

/** Cursor pagination with cancellation, bounded refresh, and visible retryable errors. */
export function useApiPage<P extends ListPath>(path: P, params: Record<string, string | number | boolean | null>, enabled = true) {
  const key = JSON.stringify([path, params]);
  const [items, setItems] = useState<Item<P>[]>([]);
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
    setError(null); if (after) setLoadingMore(true); else { setLoading(true); setItems([]); }
    try {
      let response;
      try { response = await apiGet(route, { ...filters, cursor: after, limit: 50 }, controller.signal); }
      catch (error) {
        if (!(error instanceof ApiError) || error.status !== 409) throw error;
        after = null;
        response = await apiGet(route, { ...filters, limit: 50 }, controller.signal);
      }
      if (controller.signal.aborted || currentKey.current !== key) return;
      const next = response.items as Item<P>[];
      setItems(previous => after ? [...previous, ...next] : next); setCursor(response.nextCursor);
    } catch (error) {
      if (!controller.signal.aborted && currentKey.current === key) setError(error instanceof Error ? error.message : "Could not load results");
    } finally {
      if (active.current === controller) { setLoading(false); setLoadingMore(false); active.current = null; }
    }
  }, [key]);
  useEffect(() => {
    setCursor(null); setItems([]); setError(null);
    if (enabled) void fetchPage();
    return () => { active.current?.abort(); active.current = null; };
  }, [fetchPage, enabled]);
  return { items, loading, loadingMore, error, hasMore: cursor !== null,
    loadMore: () => { if (cursor && !active.current) void fetchPage(cursor); },
    retry: () => { void fetchPage(items.length ? cursor : null); } };
}
