"use client";

import { ChunkTable } from "../chunk-table";
import { useOpsResource } from "../hooks/use-ops-resource";
import { EmptyState, ErrorState, RowsSkeleton } from "../load-states";

/** Chunks of one recording, fetched when its activity row expands. */
export function ChunkRows({ recordingId }: { recordingId: number }) {
  const { data, error, reload } = useOpsResource("/recordings/:id", { id: recordingId });
  if (error) return <ErrorState title="Could not load this recording's chunks" error={error} onRetry={reload} />;
  if (!data) return <RowsSkeleton rows={3} />;
  if (!data.chunks.length) return <EmptyState title="Not split into chunks yet" />;
  return <ChunkTable chunks={data.chunks} label={`Chunks of recording ${recordingId}`} className="bg-background" />;
}
