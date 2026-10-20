"use client";
import { useMemo } from "react";
import { useApiPage } from "./use-api-page";
import { sessionResults } from "@/lib/result-models";
/** A Streamer's Sessions, one row each however many Recordings it has (no Sessions listing route yet). */
export function useSessionSearch({ streamerId, enabled }: { streamerId: string | null; enabled: boolean }) {
 const result = useApiPage("/recordings", { streamerId, hasMatchups: true }, enabled && !!streamerId);
 const sessions = useMemo(() => (streamerId ? sessionResults(result.items, streamerId) : []), [result.items, streamerId]);
 return { sessions, isLoading: result.loading, isLoadingMore: result.loadingMore, hasMore: result.hasMore,
   loadMore: result.loadMore, error: result.error, retry: result.retry };
}
