"use client";
import { useApiPage } from "./use-api-page";
import { filterParams } from "@/lib/search-filters";
import type { ListFilters } from "./use-ghost-search";

/** The Streamers list with its counters. */
export function useStreamerList({ filters, enabled }: { filters: ListFilters; enabled: boolean }) {
 const { platform, excludePlatform } = filterParams(filters);
 return useApiPage("/streamers", { q: filters.q.trim(), platform, excludePlatform }, enabled);
}
