"use client";

import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOpsResource } from "../hooks/use-ops-resource";
import { formatDateTime, formatRelative } from "../lib/format";
import { ErrorState, RowsSkeleton } from "../load-states";
import { PageHeader } from "../page-header";
import { AttentionList } from "./attention-list";
import { PipelineStrip } from "./pipeline-strip";
import { ThroughputBars } from "./throughput-bars";
import { Timings } from "./timings";
import { OperatorGate } from "../operator-gate";

function OverviewSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading overview" className="flex flex-col gap-6">
      <Skeleton className="h-36 w-full rounded-lg" />
      <RowsSkeleton rows={4} />
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  );
}

/** Pipeline health at a glance: stage counts, attention groups, hourly throughput and timings. */
export function Overview() {
  const { data, error, loading, reload } = useOpsResource("/overview", {});
  return (
    <OperatorGate>
      <PageHeader
        title="Overview"
        description={
          data && (
            <time dateTime={data.generatedAt} title={formatDateTime(data.generatedAt)}>
              Updated {formatRelative(data.generatedAt)}
            </time>
          )
        }
        actions={
          <Button variant="outline" size="sm" onClick={reload} disabled={loading} className="pointer-coarse:h-11">
            <RotateCw aria-hidden className={loading ? "animate-spin motion-reduce:animate-none" : undefined} />
            Refresh
          </Button>
        }
      />
      {error && !data && <ErrorState title="Could not load the overview" error={error} onRetry={reload} />}
      {!data && !error && <OverviewSkeleton />}
      {data && (
        <>
          <PipelineStrip overview={data} />
          <AttentionList attention={data.attention} />
          <div className="@container">
            <div className="grid gap-6 @3xl:grid-cols-[minmax(0,1fr)_18rem]">
              <ThroughputBars throughput={data.throughput} />
              <Timings overview={data} />
            </div>
          </div>
        </>
      )}
    </OperatorGate>
  );
}
