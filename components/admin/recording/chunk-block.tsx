"use client";

import Link from "next/link";
import type { OpsChunk } from "@/lib/operator-contract";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { STATUS } from "../constants";
import { formatTimecode } from "../lib/format";
import type { Placement } from "../lib/timeline";

/** Accessible name of a chunk block: index, range, status and attempts. */
export function chunkLabel(chunk: OpsChunk): string {
  const attempts = `${chunk.attempts} attempt${chunk.attempts === 1 ? "" : "s"}`;
  return `Chunk ${chunk.index}, ${formatTimecode(chunk.startSeconds)} to ${formatTimecode(chunk.endSeconds)}, ${STATUS[chunk.status].label}, ${attempts}`;
}

/** One chunk on the timeline: a status-filled link that opens the chunk inspector. */
export function ChunkBlock({
  chunk,
  placement,
  href,
  inspected,
}: {
  chunk: OpsChunk;
  placement: Placement;
  href: string;
  inspected: boolean;
}) {
  return (
    <li className="absolute inset-y-2" style={{ left: `${placement.left}%`, width: `${placement.width}%` }}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={href}
            scroll={false}
            aria-label={chunkLabel(chunk)}
            aria-current={inspected || undefined}
            className={cn(
              "block h-full rounded-[3px] ring-1 ring-background ring-inset transition-[filter] duration-150 hover:brightness-110 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none",
              STATUS[chunk.status].fill,
              inspected && "outline-2 outline-offset-2 outline-foreground",
            )}
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="flex flex-col gap-0.5 text-xs tabular-nums">
          <span className="font-medium">
            Chunk {chunk.index} · {STATUS[chunk.status].label}
          </span>
          <span>
            {formatTimecode(chunk.startSeconds)}–{formatTimecode(chunk.endSeconds)} · {chunk.detections ?? 0} detections
          </span>
        </TooltipContent>
      </Tooltip>
    </li>
  );
}
