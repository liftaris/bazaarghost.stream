"use client";
import { useApiPage } from "./use-api-page";
import { ghostResult } from "@/lib/result-models";
/** Search native matchup cards with stable cursor pagination. */
export function useGhostSearch({ queryParam, streamerId, effectiveVod, enabled }: {
 queryParam: string; streamerId: string | null; effectiveVod: string | null; enabled: boolean;
}) {
 const result = useApiPage("/search", { q: queryParam.trim(), creatorId: streamerId,
   videoId: effectiveVod?.startsWith("v:") ? effectiveVod.slice(2) : null }, enabled);
 return { ghostResults: result.items.map(ghostResult), totalResults: result.items.length,
   isLoading: result.loading, isLoadingMore: result.loadingMore, hasMoreGhosts: result.hasMore,
   loadMoreGhosts: result.loadMore, isStale: result.isStale, error: result.error, retry: result.retry };
}
