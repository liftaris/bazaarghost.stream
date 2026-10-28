"use client";

import type { OpsRecordingDetail } from "@/lib/operator-contract";
import { ChunkTable } from "../chunk-table";
import { BulkReprocess, useChunkSelection } from "../reprocess";

/** The recording's chunk table with rerun checkboxes, the selection bar and the bulk rerun form above it. */
export function ChunksSection({ detail }: { detail: OpsRecordingDetail }) {
  const selection = useChunkSelection(detail.chunks);
  return (
    <section aria-labelledby="chunks-heading" className="flex flex-col gap-2">
      <h2 id="chunks-heading" className="text-sm font-semibold">
        Chunks <span className="font-normal text-muted-foreground tabular-nums">{detail.chunks.length}</span>
      </h2>
      <BulkReprocess detail={detail} selection={selection} />
      <ChunkTable chunks={detail.chunks} label="Chunks" selection={selection} />
    </section>
  );
}
