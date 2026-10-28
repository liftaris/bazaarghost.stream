import type { ChunkStatus, RecordingStatus, StatusCounts } from "@/lib/operator-contract";
import { cn } from "@/lib/utils";
import { CHUNK_PIPELINE, STATUS } from "./constants";

/** Status icon and label from the shared registry. */
export function StatusChip({
  status,
  className,
}: {
  status: ChunkStatus | RecordingStatus;
  className?: string;
}) {
  const { label, icon: Icon, text } = STATUS[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap", text, className)}>
      <Icon aria-hidden className="size-3.5 shrink-0" />
      {label}
    </span>
  );
}

const BAR_ORDER: readonly ChunkStatus[] = [...CHUNK_PIPELINE, "archived"];

/** Plain-language summary of chunk counts, used as the accessible name of bars. */
export function describeChunkCounts(counts: StatusCounts<ChunkStatus>): string {
  const parts = BAR_ORDER.filter((status) => counts[status] > 0).map(
    (status) => `${counts[status]} ${STATUS[status].label.toLowerCase()}`,
  );
  return parts.length ? `Chunks: ${parts.join(", ")}` : "No chunks";
}

/** A thin stacked bar of a recording's chunk statuses, proportional to each count. */
export function ChunkMiniBar({ counts, className }: { counts: StatusCounts<ChunkStatus>; className?: string }) {
  const total = BAR_ORDER.reduce((sum, status) => sum + counts[status], 0);
  const label = describeChunkCounts(counts);
  return (
    <div role="img" aria-label={label} title={label} className={cn("flex h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      {total > 0 &&
        BAR_ORDER.filter((status) => counts[status] > 0).map((status) => (
          <span key={status} className={STATUS[status].fill} style={{ width: `${(counts[status] / total) * 100}%` }} />
        ))}
    </div>
  );
}
