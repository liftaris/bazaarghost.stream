"use client";

import Link from "next/link";
import type { OpsChunk } from "@/lib/operator-contract";
import { cn } from "@/lib/utils";
import { FAILED_TEXT, MONO } from "./constants";
import { DataTable } from "./data-table";
import { useInspectParam } from "./hooks/use-inspect-param";
import { formatCount, formatMs, formatTimecode, MISSING } from "./lib/format";
import { StatusChip } from "./status-chip";

function ChunkRow({ chunk }: { chunk: OpsChunk }) {
  const { target, hrefFor } = useInspectParam();
  const inspected = target?.kind === "chunk" && target.id === chunk.id;
  return (
    <tr aria-current={inspected || undefined} className={cn("relative hover:bg-muted/60", inspected && "bg-muted")}>
      <td>
        <Link
          href={hrefFor({ kind: "chunk", id: chunk.id })}
          scroll={false}
          aria-label={`Inspect chunk ${chunk.index}`}
          className="font-medium tabular-nums after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-ring"
        >
          {chunk.index}
        </Link>
      </td>
      <td className={cn("text-xs whitespace-nowrap", MONO)}>
        {formatTimecode(chunk.startSeconds)}–{formatTimecode(chunk.endSeconds)}
      </td>
      <td>
        <StatusChip status={chunk.status} />
      </td>
      <td className="text-right">{chunk.attempts}</td>
      <td className="text-right">{formatCount(chunk.framesProcessed)}</td>
      <td className="text-right">{formatCount(chunk.detections)}</td>
      <td className="text-right whitespace-nowrap">{formatMs(chunk.durationMs)}</td>
      <td className="whitespace-nowrap text-muted-foreground">{chunk.quality ?? MISSING}</td>
      <td className={cn("relative z-10 max-w-[22rem] truncate text-xs", MONO, chunk.lastError ? FAILED_TEXT : "text-muted-foreground")} title={chunk.lastError ?? undefined}>
        {chunk.lastError ?? MISSING}
      </td>
    </tr>
  );
}

/** Chunk rows with range, status, work done and last error; each row opens the chunk inspector. */
export function ChunkTable({ chunks, label, className }: { chunks: OpsChunk[]; label: string; className?: string }) {
  return (
    <DataTable label={label} className={className}>
      <thead>
        <tr>
          <th scope="col">Chunk</th>
          <th scope="col">Range</th>
          <th scope="col">Status</th>
          <th scope="col" className="text-right!">Attempts</th>
          <th scope="col" className="text-right!">Frames</th>
          <th scope="col" className="text-right!">Detections</th>
          <th scope="col" className="text-right!">Run time</th>
          <th scope="col">Quality</th>
          <th scope="col">Last error</th>
        </tr>
      </thead>
      <tbody>
        {chunks.map((chunk) => (
          <ChunkRow key={chunk.id} chunk={chunk} />
        ))}
      </tbody>
    </DataTable>
  );
}
