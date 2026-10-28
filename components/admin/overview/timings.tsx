import Link from "next/link";
import type { IngestionJobStatus, OpsOverview } from "@/lib/operator-contract";
import { FactList } from "../data-table";
import { formatCount, formatSeconds } from "../lib/format";

const INGESTION_ORDER: readonly IngestionJobStatus[] = ["pending", "waiting", "processing", "completed", "skipped"];

/** Median queue and run times, plus ingestion job counts. */
export function Timings({ overview }: { overview: OpsOverview }) {
  const { timings, ingestion } = overview;
  return (
    <section aria-labelledby="timings-heading" className="flex flex-col gap-3">
      <h2 id="timings-heading" className="text-sm font-semibold">
        Timings
      </h2>
      <FactList
        className="rounded-lg border border-border p-3"
        facts={[
          ["Queue to claim", formatSeconds(timings.queueToClaimSeconds)],
          ["Claim to done", formatSeconds(timings.claimToDoneSeconds)],
        ]}
      />
      <p className="text-xs text-muted-foreground">Medians over the latest 200 completed chunks.</p>
      <p className="text-xs text-muted-foreground tabular-nums">
        <Link href="/admin/ingestion" className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">
          Ingestion jobs
        </Link>{" "}
        {INGESTION_ORDER.map((status) => `${formatCount(ingestion[status])} ${status}`).join(" · ")}
      </p>
    </section>
  );
}
