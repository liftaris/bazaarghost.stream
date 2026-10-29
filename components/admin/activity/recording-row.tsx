"use client";

import Link from "../console-link";
import { ChevronRight } from "lucide-react";
import { PlatformIcon } from "@/components/platform-icon";
import { Button } from "@/components/ui/button";
import type { ChunkStatus, OpsRecording } from "@/lib/operator-contract";
import { cn } from "@/lib/utils";
import { MONO } from "../constants";
import { formatCount, formatDateTime, formatRelative, MISSING } from "../lib/format";
import { ChunkMiniBar, StatusChip } from "../status-chip";
import { ChunkRows } from "./chunk-rows";

/** Number of columns in the activity table, for the expanded row's span. */
export const ACTIVITY_COLUMNS = 9;

const chunkTotal = (counts: Record<ChunkStatus, number>) => Object.values(counts).reduce((sum, n) => sum + n, 0);

/** One recording in the activity table, expandable inline to its chunks. */
export function RecordingRow({
  recording,
  expanded,
  onToggle,
}: {
  recording: OpsRecording;
  expanded: boolean;
  onToggle: () => void;
}) {
  const panelId = `recording-${recording.id}-chunks`;
  return (
    <>
      <tr className={cn("hover:bg-muted/40", expanded && "bg-muted/40")}>
        <td className="w-10 pr-0!">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-expanded={expanded}
            aria-controls={expanded ? panelId : undefined}
            aria-label={`${expanded ? "Hide" : "Show"} chunks of recording ${recording.id}`}
            onClick={onToggle}
            className="pointer-coarse:size-11"
          >
            <ChevronRight aria-hidden className={cn("transition-transform duration-150 motion-reduce:transition-none", expanded && "rotate-90")} />
          </Button>
        </td>
        <td className="w-8 px-1!">
          <PlatformIcon platform={recording.platform} className="size-3.5" />
        </td>
        <td className="hidden max-w-40 truncate @4xl:table-cell">{recording.streamer?.displayName ?? MISSING}</td>
        <td className="min-w-48">
          <Link
            href={`/admin/recordings/${recording.id}`}
            title={recording.title ?? recording.sourceId}
            className="block max-w-60 truncate font-medium pointer-coarse:-my-3 pointer-coarse:py-3 @4xl:max-w-[28rem] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
          >
            {recording.title ?? <span className={cn("text-xs", MONO)}>{recording.sourceId}</span>}
          </Link>
        </td>
        <td className="hidden whitespace-nowrap text-muted-foreground @5xl:table-cell" title={formatDateTime(recording.publishedAt)}>
          {recording.publishedAt ? new Date(recording.publishedAt).toLocaleDateString("en-US", { dateStyle: "medium" }) : MISSING}
        </td>
        <td className="w-36">
          <div className="flex items-center gap-2">
            <ChunkMiniBar counts={recording.chunkCounts} className="w-20" />
            <span className="text-xs text-muted-foreground">{formatCount(chunkTotal(recording.chunkCounts))}</span>
          </div>
        </td>
        <td className="text-right">{formatCount(recording.detections)}</td>
        <td>
          <StatusChip status={recording.status} />
        </td>
        <td className="whitespace-nowrap text-muted-foreground" title={formatDateTime(recording.lastActivityAt)}>
          {formatRelative(recording.lastActivityAt)}
        </td>
      </tr>
      {expanded && (
        <tr id={panelId}>
          <td colSpan={ACTIVITY_COLUMNS} className="bg-muted/40 px-3! pt-0! pb-3!">
            <ChunkRows recordingId={recording.id} />
          </td>
        </tr>
      )}
    </>
  );
}
