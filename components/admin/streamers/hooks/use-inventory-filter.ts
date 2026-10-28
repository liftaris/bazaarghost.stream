"use client";

import { useUrlFilters } from "../../hooks/use-url-filters";
import { parseInventoryFilter, type InventoryFilter } from "../lib/inventory";

const KEYS = ["show"] as const;

/** The inventory chip in the URL and a setter that keeps every other parameter. */
export interface InventoryFilterState {
  filter: InventoryFilter;
  setFilter: (next: InventoryFilter) => void;
}

/**
 * URL-backed inventory filter shared by every channel section of a streamer.
 * @returns {@link InventoryFilterState}
 */
export function useInventoryFilter(): InventoryFilterState {
  const { filters, setFilters } = useUrlFilters(parseInventoryFilter, KEYS);
  return {
    filter: filters.show ?? "all",
    setFilter: (next) => setFilters(next === "all" ? {} : { show: next }),
  };
}
