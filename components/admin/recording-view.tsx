"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useOpsResource } from "./hooks/use-ops-resource";
import { EmptyState, ErrorState, RowsSkeleton } from "./load-states";
import { ChunksSection } from "./recording/chunks-section";
import { DetectionsTable } from "./recording/detections-table";
import { RecordingHeader } from "./recording/recording-header";
import { RecordingTimeline } from "./recording/recording-timeline";
import { RecordingRuns } from "./runs/recording-runs";

function RecordingSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading recording" className="flex flex-col gap-6">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-12 w-full" />
      <RowsSkeleton rows={6} />
    </div>
  );
}

/** One recording: header facts, the chunk timeline, its chunks with bulk rerun, its runs and its detections. */
export function RecordingView({ id }: { id: number }) {
  const { data, error, reload } = useOpsResource("/recordings/:id", { id });

  if (error?.status === 404)
    return (
      <EmptyState title={`No recording ${id}`}>
        <Link href="/admin/activity" className="text-foreground underline underline-offset-4">
          Back to activity
        </Link>
      </EmptyState>
    );
  if (error) return <ErrorState title={`Could not load recording ${id}`} error={error} onRetry={reload} />;
  if (!data) return <RecordingSkeleton />;

  return (
    <>
      <RecordingHeader detail={data} />
      <RecordingTimeline detail={data} />
      {data.chunks.length > 0 && <ChunksSection detail={data} />}
      <RecordingRuns runs={data.runs} chunks={data.chunks} />
      <DetectionsTable detections={data.detections} />
    </>
  );
}
