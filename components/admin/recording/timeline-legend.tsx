import type { ChunkStatus, OpsChunk } from "@/lib/operator-contract";
import { cn } from "@/lib/utils";
import { CHUNK_PIPELINE, STATUS } from "../constants";

const ORDER: readonly ChunkStatus[] = [...CHUNK_PIPELINE, "archived"];

/** Swatches for the chunk statuses present, Bazaar chapters and detection ticks. */
export function TimelineLegend({ chunks }: { chunks: OpsChunk[] }) {
  const counts = new Map<ChunkStatus, number>();
  for (const chunk of chunks) counts.set(chunk.status, (counts.get(chunk.status) ?? 0) + 1);
  return (
    <ul aria-label="Legend" className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
      {ORDER.filter((status) => counts.has(status)).map((status) => (
        <li key={status} className="flex items-center gap-1.5">
          <span aria-hidden className={cn("size-2.5 rounded-sm", STATUS[status].fill)} />
          {STATUS[status].label} {counts.get(status)}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span aria-hidden className="size-2.5 rounded-sm bg-foreground/15" />
        Bazaar chapter
      </li>
      <li className="flex items-center gap-1.5">
        <span aria-hidden className="h-2.5 w-px bg-foreground/70" />
        Detection
      </li>
    </ul>
  );
}
