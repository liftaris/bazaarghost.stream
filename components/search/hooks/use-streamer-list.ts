"use client";
import { useApiPage } from "./use-api-page";
import { filterParams } from "@/lib/search-filters";
import type { ListFilters } from "./use-ghost-search";

/** The Streamers list with its counters. */
export function streamerListParams(filters: ListFilters) {
 const { platform, excludePlatform } = filterParams(filters);
 return { q: filters.q.trim(), platform, excludePlatform };
}
export function useStreamerList({ filters, enabled }: { filters: ListFilters; enabled: boolean }) {
 return useApiPage("/streamers", streamerListParams(filters), enabled);
}
