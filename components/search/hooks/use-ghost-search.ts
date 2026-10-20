"use client";
import { useApiPage } from "./use-api-page";
import { ghostResult } from "@/lib/result-models";
/** Search Matchup rows with stable cursor pagination. */
export function useGhostSearch({ queryParam, streamerId, channelId, platform, effectiveVod, enabled }: {
 queryParam: string; streamerId: string | null; channelId: string | null; platform: string | null; effectiveVod: string | null; enabled: boolean;
}) {
 const result = useApiPage("/search", { q: queryParam.trim(), streamerId, channelId, platform,
   recordingId: effectiveVod?.startsWith("v:") ? effectiveVod.slice(2) : null }, enabled);
 return { ghostResults: result.items.flatMap(item => ghostResult(item) ?? []), totalResults: result.items.length,
   isLoading: result.loading, isLoadingMore: result.loadingMore, hasMoreGhosts: result.hasMore,
   loadMoreGhosts: result.loadMore, isStale: result.isStale, error: result.error, retry: result.retry };
}
