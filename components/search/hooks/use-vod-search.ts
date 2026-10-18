"use client";
import { useApiPage } from "./use-api-page";
import { vodResult } from "@/lib/result-models";
/** Fetch complete video cards without browser joins or deduplication. */
export function useVodSearch({ queryParam, streamerId, enabled }: {
 queryParam: string; streamerId: string | null; enabled: boolean;
}) {
 const result = useApiPage("/videos", { q: queryParam.trim(), creatorId: streamerId, hasMatchups: true }, enabled);
 return { vodResults: result.items.map(vodResult), totalResults: result.items.length,
   isLoading: result.loading, isLoadingMore: result.loadingMore, hasMoreVods: result.hasMore,
   loadMoreVods: result.loadMore, error: result.error, retry: result.retry };
}
