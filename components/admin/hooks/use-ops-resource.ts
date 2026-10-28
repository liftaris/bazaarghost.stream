"use client";

import { useEffect, useState } from "react";
import type { ApiError } from "@/lib/api-client";
import { opsGet, toApiError, type OpsGetOptions } from "@/lib/operator-client";
import type { OpsRoutes } from "@/lib/operator-contract";

/** One operator read: the latest data for the current request, its error, and a retry. */
export interface OpsResource<T> {
  data: T | null;
  error: ApiError | null;
  /** True until the current request settles; earlier data for the same request stays visible. */
  loading: boolean;
  reload: () => void;
}

interface Settled<T> {
  key: string;
  attempt: number;
  data: T | null;
  error: ApiError | null;
}

/**
 * Fetch one operator route, aborting superseded requests.
 * @param options Route id and query; `null` skips the request.
 * @returns {@link OpsResource}
 */
export function useOpsResource<P extends keyof OpsRoutes>(
  path: P,
  options: OpsGetOptions<P> | null,
): OpsResource<OpsRoutes[P]> {
  const key = options ? JSON.stringify([path, options]) : null;
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<OpsRoutes[P]> | null>(null);

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    const [route, request] = JSON.parse(key) as [P, OpsGetOptions<P>];
    opsGet(route, request, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setSettled({ key, attempt, data, error: null });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setSettled({ key, attempt, data: null, error: toApiError(error) });
      },
    );
    return () => controller.abort();
  }, [key, attempt]);

  const current = settled?.key === key ? settled : null;
  return {
    data: current?.data ?? null,
    error: current?.attempt === attempt ? current.error : null,
    loading: key !== null && current?.attempt !== attempt,
    reload: () => setAttempt((n) => n + 1),
  };
}
