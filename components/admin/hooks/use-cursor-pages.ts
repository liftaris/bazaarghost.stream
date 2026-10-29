"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiError } from "@/lib/api-client";
import type { Page } from "@/lib/api-contract";
import { opsGet, toApiError, type OpsGetOptions } from "@/lib/operator-client";
import type { OpsQueries, OpsRoutes } from "@/lib/operator-contract";
import { useOpsGeneration } from "./use-ops-resource";

/** A cursor-paged operator list: the rows loaded so far, the latest response, and paging controls. */
export interface CursorPages<R, T> {
  /** The latest response, for routes that return more than the page; kept from earlier params until the new one lands. */
  latest: R | null;
  items: T[];
  loading: boolean;
  loadingMore: boolean;
  error: ApiError | null;
  hasMore: boolean;
  loadMore: () => void;
  retry: () => void;
}

interface PageState<R, T> {
  key: string;
  latest: R | null;
  items: T[];
  nextCursor: string | null;
  error: ApiError | null;
  pending: "first" | "more" | null;
}

/**
 * Cursor-page one operator list route, restarting whenever `params` change and
 * aborting superseded requests.
 * @param params Query without `cursor`; compared by value, so a fresh object each render is fine.
 * @param select Module-level function picking the page out of the response.
 * @returns {@link CursorPages}
 */
export function useCursorPages<P extends keyof OpsQueries, T>(
  path: P,
  params: Omit<OpsQueries[P], "cursor">,
  select: (response: OpsRoutes[P]) => Page<T>,
): CursorPages<OpsRoutes[P], T> {
  const generation = useOpsGeneration();
  const key = JSON.stringify([path, params, generation]);
  const [state, setState] = useState<PageState<OpsRoutes[P], T> | null>(null);
  const [attempt, setAttempt] = useState(0);
  const active = useRef<AbortController | null>(null);

  const fetchPage = useCallback(
    (cursor: string | null) => {
      active.current?.abort();
      const controller = new AbortController();
      active.current = controller;
      const [route, query] = JSON.parse(key) as [P, OpsQueries[P]];
      const options = { params: { ...query, ...(cursor && { cursor }) } } as OpsGetOptions<P>;
      opsGet(route, options, controller.signal).then(
        (response) => {
          if (controller.signal.aborted) return;
          const page = select(response);
          setState((prev) => ({
            key,
            latest: response,
            items: cursor && prev?.key === key ? [...prev.items, ...page.items] : page.items,
            nextCursor: page.nextCursor,
            error: null,
            pending: null,
          }));
        },
        (error: unknown) => {
          if (controller.signal.aborted) return;
          const failure = toApiError(error);
          const denied = failure.status === 401 || failure.status === 403;
          setState((prev) => ({
            ...(!denied && prev?.key === key ? prev : { key, latest: denied ? null : prev?.latest ?? null, items: [], nextCursor: null }),
            error: failure,
            pending: null,
          }));
        },
      );
    },
    [key, select],
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

  return {
    latest: state?.latest ?? null,
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
