"use client";
import { useMemo } from "react";
import { useApiPage } from "./use-api-page";
import { sessionResult } from "@/lib/result-models";
/** A Streamer's Sessions, one row each. */
export function useSessionSearch({ streamerId, enabled }: { streamerId: string | null; enabled: boolean }) {
 const result = useApiPage("/sessions", { streamerId }, enabled && !!streamerId);
 const sessions = useMemo(() => (streamerId ? result.items.map((session) => sessionResult(session, streamerId)) : []), [result.items, streamerId]);
 return { sessions, isLoading: result.loading, isLoadingMore: result.loadingMore, hasMore: result.hasMore,
   loadMore: result.loadMore, error: result.error, retry: result.retry };
}
