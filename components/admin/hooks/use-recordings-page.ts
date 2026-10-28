"use client";

import type { OpsRecording, OpsRoutes } from "@/lib/operator-contract";
import { parseActivityFilters, type ActivityFilters } from "../lib/activity-filters";
import { useCursorPages, type CursorPages } from "./use-cursor-pages";
import { useUrlFilters, type UrlFilters } from "./use-url-filters";

const PAGE_SIZE = 50;
const KEYS = ["status", "chunkStatus", "platform", "q"] as const;
const page = (response: OpsRoutes["/recordings"]) => response;

/** The activity list: URL filters, the rows loaded so far, and paging controls. */
export type RecordingsPage = UrlFilters<ActivityFilters> & CursorPages<OpsRoutes["/recordings"], OpsRecording>;

/**
 * Cursor-page `/ops/recordings` for the filters in the URL.
 * @returns {@link RecordingsPage}
 */
export function useRecordingsPage(): RecordingsPage {
  const url = useUrlFilters(parseActivityFilters, KEYS);
  const pages = useCursorPages("/recordings", { ...url.filters, limit: PAGE_SIZE }, page);
  return { ...url, ...pages };
}
