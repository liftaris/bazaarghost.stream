import type { OpsOverview } from "@/lib/operator-contract";

/** One hourly bucket from the overview. */
export type ThroughputBucket = OpsOverview["throughput"][number];

/** A bucket placed on the shared scale, heights in percent of the tallest hour. */
export interface ThroughputColumn extends ThroughputBucket {
  completedHeight: number;
  failedHeight: number;
}

/** Totals across the window. */
export interface ThroughputTotals {
  completed: number;
  failed: number;
}

/** Scale every hour against the busiest one so columns compare at a glance. */
export function throughputColumns(buckets: readonly ThroughputBucket[]): ThroughputColumn[] {
  const max = Math.max(1, ...buckets.map((bucket) => bucket.completed + bucket.failed));
  return buckets.map((bucket) => ({
    ...bucket,
    completedHeight: (bucket.completed / max) * 100,
    failedHeight: (bucket.failed / max) * 100,
  }));
}

/** Sum completed and failed chunks over the window. */
export function throughputTotals(buckets: readonly ThroughputBucket[]): ThroughputTotals {
  return buckets.reduce(
    (totals, bucket) => ({ completed: totals.completed + bucket.completed, failed: totals.failed + bucket.failed }),
    { completed: 0, failed: 0 },
  );
}
