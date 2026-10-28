"use client";

import { useMemo } from "react";
import type { OpsRecordingDetail } from "@/lib/operator-contract";
import { cn } from "@/lib/utils";
import { MONO } from "../constants";
import { useInspectParam } from "../hooks/use-inspect-param";
import { formatTimecode } from "../lib/format";
import { axisLabels, chapterSpans, placeSpan, placeTick, timelineExtent } from "../lib/timeline";
import { EmptyState } from "../load-states";
import { ChunkBlock } from "./chunk-block";
import { TimelineLegend } from "./timeline-legend";

/**
 * The recording as one bar: Bazaar chapters as the base layer, chunk blocks
 * coloured by status on top, and detection ticks below. A block opens its chunk.
 */
export function RecordingTimeline({ detail }: { detail: OpsRecordingDetail }) {
  const { recording, chunks, detections } = detail;
  const { target, hrefFor } = useInspectParam();
  const geometry = useMemo(() => {
    const chapters = chapterSpans(recording.bazaarChapters);
    const chunkSpans = chunks.map((chunk) => ({ start: chunk.startSeconds, end: chunk.endSeconds }));
    const extent = timelineExtent(recording.durationSeconds, [...chapters, ...chunkSpans]);
    return {
      chapters: chapters.map((span) => ({ span, placement: placeSpan(span, extent) })),
      blocks: chunks.map((chunk, i) => ({ chunk, placement: placeSpan(chunkSpans[i], extent) })),
      ticks: detections.map((detection) => ({ id: detection.id, left: placeTick(detection.at, extent) })),
      axis: axisLabels(extent),
    };
  }, [recording.bazaarChapters, recording.durationSeconds, chunks, detections]);

  if (!chunks.length)
    return <EmptyState title="Not split into chunks yet">Chunks appear here once the recording is scheduled.</EmptyState>;

  return (
    <section aria-labelledby="timeline-heading" className="@container flex flex-col gap-2">
      <h2 id="timeline-heading" className="text-sm font-semibold">
        Timeline
      </h2>
      <div className="relative h-12 rounded-md bg-muted">
        {geometry.chapters.map(({ span, placement }) => (
          <div
            key={span.start}
            aria-hidden
            title={`Bazaar chapter ${formatTimecode(span.start)}–${formatTimecode(span.end)}`}
            className="absolute inset-y-0 rounded-[3px] bg-foreground/15"
            style={{ left: `${placement.left}%`, width: `${placement.width}%` }}
          />
        ))}
        <ol aria-label={`${chunks.length} chunks`} className="absolute inset-0">
          {geometry.blocks.map(({ chunk, placement }) => (
            <ChunkBlock
              key={chunk.id}
              chunk={chunk}
              placement={placement}
              href={hrefFor({ kind: "chunk", id: chunk.id })}
              inspected={target?.kind === "chunk" && target.id === chunk.id}
            />
          ))}
        </ol>
      </div>
      <div role="img" aria-label={`${detections.length} detections`} className="relative h-3">
        {geometry.ticks.map((tick) => (
          <span
            key={tick.id}
            className={cn(
              "absolute inset-y-0 w-px",
              target?.kind === "detection" && target.id === tick.id ? "bg-primary" : "bg-foreground/70",
            )}
            style={{ left: `${tick.left}%` }}
          />
        ))}
      </div>
      <div aria-hidden className={cn("relative h-4 text-[11px] text-muted-foreground", MONO)}>
        {geometry.axis.map((label) => (
          <span
            key={label.at}
            className={cn(
              "absolute top-0",
              label.align === "start" ? "left-0" : label.align === "end" ? "right-0" : "-translate-x-1/2",
              label.minor && "hidden @sm:inline",
            )}
            style={label.align === "center" ? { left: `${label.left}%` } : undefined}
          >
            {formatTimecode(label.at)}
          </span>
        ))}
      </div>
      <TimelineLegend chunks={chunks} />
    </section>
  );
}
