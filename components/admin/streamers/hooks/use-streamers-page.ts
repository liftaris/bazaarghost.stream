"use client";

import type { OpsRoutes, OpsStreamer } from "@/lib/operator-contract";
import { useCursorPages, type CursorPages } from "../../hooks/use-cursor-pages";
import { useUrlFilters, type UrlFilters } from "../../hooks/use-url-filters";
import { parseStreamerSearch, type StreamerSearch } from "../lib/search";

const PAGE_SIZE = 50;
const KEYS = ["q"] as const;
const page = (response: OpsRoutes["/streamers"]) => response;

/** The streamer list: the URL search, the rows loaded so far, and paging controls. */
export type StreamersPage = UrlFilters<StreamerSearch> & CursorPages<OpsRoutes["/streamers"], OpsStreamer>;

/**
 * Cursor-page `/ops/streamers` for the search in the URL.
 * @returns {@link StreamersPage}
 */
export function useStreamersPage(): StreamersPage {
  const url = useUrlFilters(parseStreamerSearch, KEYS);
  const pages = useCursorPages("/streamers", { ...url.filters, limit: PAGE_SIZE }, page);
  return { ...url, ...pages };
}
