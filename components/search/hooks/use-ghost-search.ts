"use client";
import { useMemo } from "react";
import { useApiPage } from "./use-api-page";
import { ghostResult } from "@/lib/result-models";
import { filterParams, type PlatformFilter } from "@/lib/search-filters";
import { pickSource, preferredPlatform } from "@/lib/sources";

export interface ListFilters extends PlatformFilter {
  q: string; from: string | null; to: string | null;
}

/** Search Matchup rows with stable cursor pagination; each row plays the Source the filter allows. */
export function useGhostSearch({ filters, streamerId, channelId, enabled }: {
 filters: ListFilters; streamerId: string | null; channelId: string | null; enabled: boolean;
}) {
 const result = useApiPage("/search", { q: filters.q.trim(), streamerId, channelId, ...filterParams(filters) }, enabled);
 const { include, exclude } = filters;
 const ghostResults = useMemo(() => {
   const preferred = preferredPlatform();
   return result.items.flatMap(item => ghostResult(item, pickSource(item, null, preferred, { include, exclude })) ?? []);
 }, [result.items, include, exclude]);
 return { ...result, items: ghostResults };
}
