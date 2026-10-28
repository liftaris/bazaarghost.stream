"use client";

import { useId, useState } from "react";
import type { OpsRecordingDetail } from "@/lib/operator-contract";
import { useOpsResource } from "../hooks/use-ops-resource";
import { chunkLabeller, configBlock, defaultsChunk } from "../lib/reprocess";
import { ErrorState, RowsSkeleton } from "../load-states";
import type { ChunkSelectionState } from "./hooks/use-chunk-selection";
import { ReprocessPanel } from "./reprocess-panel";
import { RerunFacts } from "./rerun-facts";
import { SelectionBar } from "./selection-bar";

/**
 * The bulk form for ticked chunks. One request sends one set of inputs, so the form starts from
 * the `runDefaults` of the earliest ticked chunk at the moment it opened, and keeps that start
 * while the selection changes or queued chunks drop out of it.
 */
function BulkPanel({
  detail,
  selection,
  defaultsFrom,
  id,
}: {
  detail: OpsRecordingDetail;
  selection: ChunkSelectionState;
  defaultsFrom: string;
  id: string;
}) {
  const { data, error, reload } = useOpsResource("/chunks/:id", { id: defaultsFrom });
  const chunkIds = detail.chunks.filter((chunk) => selection.selected.has(chunk.id)).map((chunk) => chunk.id);
  const detections = detail.detections.filter((detection) => selection.selected.has(detection.chunkId)).length;
  const count = chunkIds.length;
  return (
    <div id={id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      {error && !data && <ErrorState title="Could not load rerun defaults" error={error} onRetry={reload} />}
      {!data && !error && <RowsSkeleton rows={4} />}
      {data && (
        <ReprocessPanel
          title={count ? `Rerun ${count} selected ${count === 1 ? "chunk" : "chunks"}` : "Rerun selected chunks"}
          chunkIds={chunkIds}
          defaults={data.runDefaults}
          blocked={count ? configBlock(data.runDefaults) : "Tick chunks in the table to rerun them."}
          chunkLabel={chunkLabeller(detail.chunks)}
          facts={<RerunFacts runtimeImage={data.runDefaults.inputs.runtime_image} recording={detail.recording} detections={detections} />}
        />
      )}
    </div>
  );
}

/** Selection bar and inline bulk rerun form above a recording's chunk table. */
export function BulkReprocess({ detail, selection }: { detail: OpsRecordingDetail; selection: ChunkSelectionState }) {
  const [defaultsFrom, setDefaultsFrom] = useState<string | null>(null);
  const panelId = useId();
  if (!selection.selected.size && !defaultsFrom) return null;
  return (
    <>
      <SelectionBar
        count={selection.selected.size}
        open={defaultsFrom !== null}
        controls={panelId}
        onClear={selection.clear}
        onToggle={() => setDefaultsFrom(defaultsFrom ? null : defaultsChunk(detail.chunks, selection.selected))}
      />
      {defaultsFrom && (
        <BulkPanel
          id={panelId}
          detail={detail}
          selection={selection}
          defaultsFrom={defaultsFrom}
        />
      )}
    </>
  );
}
