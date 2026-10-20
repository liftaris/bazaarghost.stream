"use client";
import { useApiPage } from "./use-api-page";
import { filterParams } from "@/lib/search-filters";
import type { ListFilters } from "./use-ghost-search";

/** Sessions (the Recordings list), newest first or by relevance. */
export function useRecordingSearch({ filters, streamerId, enabled }: {
 filters: ListFilters; streamerId: string | null; enabled: boolean;
}) {
 return useApiPage("/sessions", { q: filters.q.trim(), streamerId, ...filterParams(filters) }, enabled);
}
