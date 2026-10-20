"use client";
import { useApiPage } from "./use-api-page";
import { vodResult } from "@/lib/result-models";
/** Fetch complete recording cards without browser joins or deduplication. */
export function useVodSearch({ queryParam, streamerId, enabled }: {
 queryParam: string; streamerId: string | null; enabled: boolean;
}) {
 const result = useApiPage("/recordings", { q: queryParam.trim(), streamerId, hasMatchups: true }, enabled);
 return { vodResults: result.items.map(vodResult), totalResults: result.items.length,
   isLoading: result.loading, isLoadingMore: result.loadingMore, hasMoreVods: result.hasMore,
   loadMoreVods: result.loadMore, error: result.error, retry: result.retry };
}
