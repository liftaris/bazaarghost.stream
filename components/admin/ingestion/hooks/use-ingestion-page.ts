"use client";

import type { OpsIngestion, OpsIngestionJob, OpsRoutes } from "@/lib/operator-contract";
import { useCursorPages, type CursorPages } from "../../hooks/use-cursor-pages";
import { useUrlFilters, type UrlFilters } from "../../hooks/use-url-filters";
import { parseJobFilters, type JobFilters } from "../lib/job-filters";

const PAGE_SIZE = 50;
const KEYS = ["platform", "kind", "status"] as const;
const jobs = (response: OpsIngestion) => response.jobs;

/** The ingestion page: job filters in the URL, jobs loaded so far, and the latest switches, dispatch and catalog work. */
export type IngestionPage = UrlFilters<JobFilters> & CursorPages<OpsRoutes["/ingestion"], OpsIngestionJob>;

/**
 * Cursor-page `/ops/ingestion` jobs for the filters in the URL.
 * @returns {@link IngestionPage}
 */
export function useIngestionPage(): IngestionPage {
  const url = useUrlFilters(parseJobFilters, KEYS);
  const pages = useCursorPages("/ingestion", { ...url.filters, limit: PAGE_SIZE }, jobs);
  return { ...url, ...pages };
}
