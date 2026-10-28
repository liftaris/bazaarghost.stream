import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ChunkStatus, OpsOverview, RecordingStatus } from "@/lib/operator-contract";
import { cn } from "@/lib/utils";
import { CHUNK_PIPELINE, RECORDING_PIPELINE, STATUS } from "../constants";
import { activityHref } from "../lib/activity-filters";
import { formatCount } from "../lib/format";

interface Stage {
  status: ChunkStatus | RecordingStatus;
  count: number;
  href: string;
  title: string;
}

const STAGE =
  "flex min-w-[7.5rem] flex-1 flex-col gap-0.5 rounded-md px-3 py-2 transition-colors duration-150 motion-reduce:transition-none";

function StageCell({ stage }: { stage: Stage }) {
  const { label, icon: Icon, text } = STATUS[stage.status];
  const body = (
    <>
      <span className={cn("flex items-center gap-1.5 text-xs font-medium", text)}>
        <Icon aria-hidden className="size-3.5" />
        {label}
      </span>
      <span className={cn("text-xl font-semibold tabular-nums", stage.count === 0 && "text-muted-foreground")}>
        {formatCount(stage.count)}
      </span>
    </>
  );
  return (
    <Link href={stage.href} title={stage.title} className={cn(STAGE, "hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring")}>
      {body}
    </Link>
  );
}

function StageRow({ label, stages }: { label: string; stages: Stage[] }) {
  return (
    <div className="flex flex-col gap-1 @4xl:flex-row @4xl:items-center">
      <h3 className="w-24 shrink-0 px-3 text-sm font-medium @4xl:px-0">{label}</h3>
      <ol className="grid flex-1 grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] @4xl:flex @4xl:items-center">
        {stages.map((stage, i) => (
          <li key={stage.status} className="flex items-center @4xl:flex-1">
            {i > 0 && <ChevronRight aria-hidden className="hidden size-4 shrink-0 text-muted-foreground/60 @4xl:block" />}
            <StageCell stage={stage} />
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * Stage counts for recordings and chunks, left to right with arrows when one
 * row fits, else as an even grid; each count opens the matching activity rows.
 */
export function PipelineStrip({ overview }: { overview: OpsOverview }) {
  const recordings = RECORDING_PIPELINE.map((status) => ({
    status,
    count: overview.recordings[status],
    href: activityHref({ status }),
    title: `Show ${STATUS[status].label.toLowerCase()} recordings`,
  }));
  const chunks = CHUNK_PIPELINE.map((status) => ({
    status,
    count: overview.chunks[status],
    href: activityHref({ chunkStatus: status }),
    title: `Show recordings with ${STATUS[status].label.toLowerCase()} chunks`,
  }));
  return (
    <section aria-labelledby="pipeline-heading" className="@container flex flex-col gap-2 rounded-lg border border-border p-2">
      <h2 id="pipeline-heading" className="sr-only">
        Pipeline
      </h2>
      <StageRow label="Recordings" stages={recordings} />
      <div className="h-px bg-border" />
      <StageRow label="Chunks" stages={chunks} />
    </section>
  );
}
