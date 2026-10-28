"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { ChunkTable } from "./chunk-table";
import { useOpsResource } from "./hooks/use-ops-resource";
import { EmptyState, ErrorState, RowsSkeleton } from "./load-states";
import { DetectionsTable } from "./recording/detections-table";
import { RecordingHeader } from "./recording/recording-header";
import { RecordingTimeline } from "./recording/recording-timeline";

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

/** One recording: header facts, the chunk timeline, and its chunk and detection tables. */
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
      {data.chunks.length > 0 && (
        <section aria-labelledby="chunks-heading" className="flex flex-col gap-2">
          <h2 id="chunks-heading" className="text-sm font-semibold">
            Chunks <span className="font-normal text-muted-foreground tabular-nums">{data.chunks.length}</span>
          </h2>
          <ChunkTable chunks={data.chunks} label="Chunks" />
        </section>
      )}
      <DetectionsTable detections={data.detections} />
    </>
  );
}
