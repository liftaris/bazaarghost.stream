import type { RecordingStatus } from "@/lib/operator-contract";

/** Recording status filter values the activity list accepts, in pipeline order. */
export const ACTIVITY_STATUSES = [
  "attention",
  "pending",
  "processing",
  "partial",
  "completed",
  "failed",
] as const satisfies readonly (RecordingStatus | "attention")[];

/** One activity status filter: a recording status or the synthetic `attention` group. */
export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];

/** URL-backed filters of the activity list; absent keys mean "any". */
export interface ActivityFilters {
  status?: ActivityStatus;
  platform?: string;
  q?: string;
}

const isStatus = (value: string): value is ActivityStatus =>
  (ACTIVITY_STATUSES as readonly string[]).includes(value);

/** Read filters from the URL, dropping unknown statuses and blank values. */
export function parseActivityFilters(search: string | URLSearchParams): ActivityFilters {
  const params = new URLSearchParams(search);
  const status = params.get("status") ?? "";
  const platform = params.get("platform")?.trim().toLowerCase();
  const q = params.get("q")?.trim();
  return {
    ...(isStatus(status) && { status }),
    ...(platform && { platform }),
    ...(q && { q }),
  };
}

/** Link to the activity list with these filters. */
export function activityHref(filters: ActivityFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.platform) params.set("platform", filters.platform);
  if (filters.q) params.set("q", filters.q);
  const query = params.toString();
  return `/admin/activity${query ? `?${query}` : ""}`;
}
