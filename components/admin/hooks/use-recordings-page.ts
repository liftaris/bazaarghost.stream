"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ApiError } from "@/lib/api-client";
import { opsGet, toApiError } from "@/lib/operator-client";
import type { OpsRecording } from "@/lib/operator-contract";
import { parseActivityFilters, type ActivityFilters } from "../lib/activity-filters";

const PAGE_SIZE = 50;

/** The activity list: URL filters, the rows loaded so far, and paging controls. */
export interface RecordingsPage {
  filters: ActivityFilters;
  /** Replace the filters in the URL, keeping unrelated parameters such as `inspect`. */
  setFilters: (next: ActivityFilters) => void;
  items: OpsRecording[];
  loading: boolean;
  loadingMore: boolean;
  error: ApiError | null;
  hasMore: boolean;
  loadMore: () => void;
  retry: () => void;
}

interface PageState {
  key: string;
  items: OpsRecording[];
  nextCursor: string | null;
  error: ApiError | null;
  pending: "first" | "more" | null;
}

/**
 * Cursor-page `/ops/recordings` for the filters in the URL.
 * @returns {@link RecordingsPage}
 */
export function useRecordingsPage(): RecordingsPage {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const search = searchParams.toString();
  const filters = useMemo(() => parseActivityFilters(search), [search]);
  const key = JSON.stringify(filters);
  const [state, setState] = useState<PageState | null>(null);
  const [attempt, setAttempt] = useState(0);
  const active = useRef<AbortController | null>(null);

  const fetchPage = useCallback(
    (cursor: string | null) => {
      active.current?.abort();
      const controller = new AbortController();
      active.current = controller;
      const params = { ...(JSON.parse(key) as ActivityFilters), limit: PAGE_SIZE, ...(cursor && { cursor }) };
      opsGet("/recordings", { params }, controller.signal).then(
        (page) => {
          if (controller.signal.aborted) return;
          setState((prev) => ({
            key,
            items: cursor && prev?.key === key ? [...prev.items, ...page.items] : page.items,
            nextCursor: page.nextCursor,
            error: null,
            pending: null,
          }));
        },
        (error: unknown) => {
          if (controller.signal.aborted) return;
          setState((prev) => ({
            key,
            items: prev?.key === key ? prev.items : [],
            nextCursor: prev?.key === key ? prev.nextCursor : null,
            error: toApiError(error),
            pending: null,
          }));
        },
      );
    },
    [key],
  );

  useEffect(() => {
    fetchPage(null);
    return () => active.current?.abort();
  }, [fetchPage, attempt]);

  const current = state?.key === key ? state : null;

  const loadMore = () => {
    if (!current?.nextCursor || current.pending) return;
    setState({ ...current, error: null, pending: "more" });
    fetchPage(current.nextCursor);
  };

  const setFilters = (next: ActivityFilters) => {
    const params = new URLSearchParams(search);
    for (const name of ["status", "platform", "q"] as const) {
      const value = next[name];
      if (value) params.set(name, value);
      else params.delete(name);
    }
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  };

  return {
    filters,
    setFilters,
    items: current?.items ?? [],
    loading: !current || current.pending === "first",
    loadingMore: current?.pending === "more",
    error: current?.error ?? null,
    hasMore: Boolean(current?.nextCursor),
    loadMore,
    retry: () => {
      if (current?.items.length) return loadMore();
      if (current) setState({ ...current, error: null, pending: "first" });
      setAttempt((n) => n + 1);
    },
  };
}
