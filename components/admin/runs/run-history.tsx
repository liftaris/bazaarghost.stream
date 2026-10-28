"use client";

import type { OpsRun } from "@/lib/operator-contract";
import { cn } from "@/lib/utils";
import { FAILED_TEXT, MONO } from "../constants";
import { formatCount } from "../lib/format";
import { runInputsLabel } from "../lib/reprocess";
import { runOrigin, type Viewer } from "../lib/runs";
import { EmptyState } from "../load-states";
import { RelativeTime } from "../relative-time";
import { StatusChip } from "../status-chip";
import { GithubRunLink, RunOrigin, useViewer } from "./run-parts";

const LONG_ERROR = 160;

function RunError({ error }: { error: string }) {
  const text = cn("text-xs break-words whitespace-pre-wrap", MONO, FAILED_TEXT);
  if (error.length <= LONG_ERROR) return <p className={text}>{error}</p>;
  return (
    <details className="group flex flex-col gap-1">
      <summary className="cursor-pointer list-none rounded-sm focus-visible:outline-2 focus-visible:outline-ring pointer-coarse:min-h-11 pointer-coarse:py-2">
        <span className={cn(text, "line-clamp-2 group-open:hidden")}>{error}</span>
        <span className="text-xs text-muted-foreground underline underline-offset-4 group-open:hidden">Full error</span>
        <span className="hidden text-xs text-muted-foreground underline underline-offset-4 group-open:inline">Hide full error</span>
      </summary>
      <pre className={cn(text, "mt-1 rounded-md bg-muted p-2")}>{error}</pre>
    </details>
  );
}

function Step({ label, iso }: { label: string; iso: string | null }) {
  return (
    <div className="flex min-w-0 flex-col">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>
        <RelativeTime iso={iso} />
      </dd>
    </div>
  );
}

const plural = (n: number | null, one: string, many: string) => `${formatCount(n)} ${n === 1 ? one : many}`;

function RunItem({ run, viewer }: { run: OpsRun; viewer: Viewer | null }) {
  return (
    <li className="flex min-w-0 flex-col gap-1.5 px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <StatusChip status={run.status} />
        <GithubRunLink url={run.githubRunUrl} />
      </div>
      <p className="flex flex-wrap gap-x-2 text-sm">
        <RunOrigin requester={runOrigin(run, viewer)} />
        <span className="text-muted-foreground">{run.inputs ? runInputsLabel(run.inputs) : "Not dispatched by the backend"}</span>
      </p>
      <dl className="grid grid-cols-3 gap-2 text-xs tabular-nums">
        <Step label="Queued" iso={run.queuedAt} />
        <Step label="Claimed" iso={run.claimedAt} />
        <Step label="Finished" iso={run.finishedAt} />
      </dl>
      {(run.framesProcessed != null || run.detections != null) && (
        <p className="text-xs text-muted-foreground tabular-nums">
          {plural(run.framesProcessed, "frame", "frames")} · {plural(run.detections, "detection", "detections")}
        </p>
      )}
      {run.error && <RunError error={run.error} />}
    </li>
  );
}

/** Every recorded run of one chunk, newest first: status, who asked, inputs, timings, output, error and GitHub run. */
export function RunHistory({ runs }: { runs: readonly OpsRun[] }) {
  const viewer = useViewer();
  if (!runs.length) return <EmptyState title="No runs recorded yet" />;
  return (
    <section aria-labelledby="chunk-runs" className="flex flex-col gap-1.5">
      <h3 id="chunk-runs" className="text-xs font-medium text-muted-foreground">
        Runs <span className="tabular-nums">({runs.length})</span>
      </h3>
      <ol className="flex flex-col divide-y divide-border rounded-md border border-border">
        {runs.map((run) => (
          <RunItem key={run.id} run={run} viewer={viewer} />
        ))}
      </ol>
    </section>
  );
}
