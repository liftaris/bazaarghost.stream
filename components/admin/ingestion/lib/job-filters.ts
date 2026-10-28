import type { IngestionJobKind, IngestionJobStatus } from "@/lib/operator-contract";

/** Job kinds the ingestion route filters by. */
export const JOB_KINDS = ["account", "video", "discovery"] as const satisfies readonly IngestionJobKind[];

/** Job statuses the ingestion route filters by, in lifecycle order. */
export const JOB_STATUSES = ["pending", "waiting", "processing", "completed", "skipped"] as const satisfies readonly IngestionJobStatus[];

/** URL-backed filters of the ingestion job table; absent keys mean "any". */
export interface JobFilters {
  platform?: string;
  kind?: IngestionJobKind;
  status?: IngestionJobStatus;
}

const pick = <V extends string>(values: readonly V[], value: string | null): V | undefined =>
  values.find((candidate) => candidate === value);

/** Read job filters from the URL, dropping unknown kinds, statuses and blank platforms. */
export function parseJobFilters(search: string | URLSearchParams): JobFilters {
  const params = new URLSearchParams(search);
  const platform = params.get("platform")?.trim().toLowerCase();
  const kind = pick(JOB_KINDS, params.get("kind"));
  const status = pick(JOB_STATUSES, params.get("status"));
  return { ...(platform && { platform }), ...(kind && { kind }), ...(status && { status }) };
}
