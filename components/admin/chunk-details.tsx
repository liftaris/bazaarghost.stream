"use client";

import Link from "next/link";
import { PlatformIcon } from "@/components/platform-icon";
import type { OpsChunkDetail } from "@/lib/operator-contract";
import { cn } from "@/lib/utils";
import { FAILED_TEXT, MONO } from "./constants";
import { FactList } from "./data-table";
import { useInspectParam } from "./hooks/use-inspect-param";
import { IdChip } from "./id-chip";
import { formatCount, formatDateTime, formatMs, formatRelative, formatTimecode, MISSING } from "./lib/format";
import { withInspect } from "./lib/inspect";
import { EmptyState } from "./load-states";
import { ChunkReprocess } from "./reprocess";
import { RunHistory } from "./runs/run-history";
import { StatusChip } from "./status-chip";

function When({ iso }: { iso: string | null }) {
  return iso ? <time dateTime={iso} title={formatDateTime(iso)}>{formatRelative(iso)}</time> : <>{MISSING}</>;
}

/** Status, range, timings, last error, the rerun form, run history and detections of one chunk. */
export function ChunkDetails({ detail }: { detail: OpsChunkDetail }) {
  const { chunk, recording, detections } = detail;
  const recordingHref = `/admin/recordings/${recording.id}${withInspect("", { kind: "chunk", id: chunk.id })}`;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <StatusChip status={chunk.status} />
          <span className={cn("text-sm tabular-nums", MONO)}>
            {formatTimecode(chunk.startSeconds)}–{formatTimecode(chunk.endSeconds)}
          </span>
        </div>
        <IdChip value={chunk.id} label="Copy chunk id" />
        <Link
          href={recordingHref}
          className="flex min-w-0 items-center gap-2 text-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
        >
          <PlatformIcon platform={recording.platform} className="size-3.5" />
          <span className="truncate">{recording.title ?? recording.sourceId}</span>
          <span className="shrink-0 text-muted-foreground tabular-nums">· chunk {chunk.index}</span>
        </Link>
      </div>

      <FactList
        facts={[
          ["Attempts", chunk.attempts],
          ["Quality", chunk.quality ?? MISSING],
          ["Frames", formatCount(chunk.framesProcessed)],
          ["Detections", formatCount(chunk.detections)],
          ["Run time", formatMs(chunk.durationMs)],
          ["Queued", <When iso={chunk.queuedAt} />],
          ["Started", <When iso={chunk.startedAt} />],
          ["Completed", <When iso={chunk.completedAt} />],
          ["Lease expires", <When iso={chunk.leaseExpiresAt} />],
          ["Updated", <When iso={chunk.updatedAt} />],
        ]}
      />

      {chunk.lastError && (
        <section aria-labelledby="chunk-error" className="flex flex-col gap-1.5">
          <h3 id="chunk-error" className="text-xs font-medium text-muted-foreground">
            Last error
          </h3>
          <pre className={cn("max-h-56 overflow-auto rounded-md bg-muted p-3 text-xs break-words whitespace-pre-wrap", MONO, FAILED_TEXT)}>
            {chunk.lastError}
          </pre>
        </section>
      )}

      <ChunkReprocess detail={detail} />
      <RunHistory runs={detail.runs} />
      <ChunkDetections detections={detections} />
    </div>
  );
}

function ChunkDetections({ detections }: { detections: OpsChunkDetail["detections"] }) {
  const { hrefFor } = useInspectParam();
  if (!detections.length) return <EmptyState title="No detections in this chunk" />;
  return (
    <section aria-labelledby="chunk-detections" className="flex flex-col gap-1.5">
      <h3 id="chunk-detections" className="text-xs font-medium text-muted-foreground">
        Detections <span className="tabular-nums">({detections.length})</span>
      </h3>
      <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
        {detections.map((detection) => (
          <li key={detection.id}>
            <Link
              href={hrefFor({ kind: "detection", id: detection.id })}
              scroll={false}
              className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-2 px-3 py-1.5 text-sm tabular-nums hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
            >
              <span className={cn("text-xs", MONO)}>{formatTimecode(detection.at)}</span>
              <span className={cn("truncate", !detection.username && "text-muted-foreground")}>
                {detection.username ?? "Unread name"}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {[detection.rank, detection.igd != null && `Day ${detection.igd}`].filter(Boolean).join(" · ") || MISSING}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
