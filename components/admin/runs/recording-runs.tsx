"use client";

import Link from "../console-link";
import type { OpsChunk, OpsRun } from "@/lib/operator-contract";
import { DataTable } from "../data-table";
import { useInspectParam } from "../hooks/use-inspect-param";
import { MISSING } from "../lib/format";
import { runInputsLabel } from "../lib/reprocess";
import { runOrigin } from "../lib/runs";
import { RelativeTime } from "../relative-time";
import { StatusChip } from "../status-chip";
import { GithubRunLink, RunOrigin, useViewer } from "./run-parts";

/** The recording's latest runs across its chunks, newest first; each chunk cell opens that chunk in the inspector. */
export function RecordingRuns({ runs, chunks }: { runs: readonly OpsRun[]; chunks: readonly OpsChunk[] }) {
  const { hrefFor } = useInspectParam();
  const viewer = useViewer();
  if (!runs.length) return null;
  const index = new Map(chunks.map((chunk) => [chunk.id, chunk.index]));
  return (
    <section aria-labelledby="runs-heading" className="@container flex flex-col gap-2">
      <h2 id="runs-heading" className="text-sm font-semibold">
        Runs <span className="font-normal text-muted-foreground tabular-nums">{runs.length}</span>
      </h2>
      <DataTable label="Runs of this recording">
        <thead>
          <tr>
            <th scope="col">Chunk</th>
            <th scope="col">Status</th>
            <th scope="col" className="hidden @2xl:table-cell">
              Origin
            </th>
            <th scope="col" className="hidden @3xl:table-cell">
              Inputs
            </th>
            <th scope="col">Queued</th>
            <th scope="col" className="hidden @xl:table-cell">
              Finished
            </th>
            <th scope="col">
              <span className="sr-only">GitHub run</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id}>
              <td>
                <Link
                  href={hrefFor({ kind: "chunk", id: run.chunkId })}
                  scroll={false}
                  className="inline-flex items-center font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring pointer-coarse:min-h-11 pointer-coarse:min-w-11"
                >
                  {index.get(run.chunkId) ?? run.chunkId.slice(0, 8)}
                </Link>
              </td>
              <td>
                <StatusChip status={run.status} />
              </td>
              <td className="hidden max-w-56 truncate @2xl:table-cell">
                <RunOrigin requester={runOrigin(run, viewer)} />
              </td>
              <td className="hidden whitespace-nowrap text-muted-foreground @3xl:table-cell">
                {run.inputs ? runInputsLabel(run.inputs) : MISSING}
              </td>
              <td>
                <RelativeTime iso={run.queuedAt} />
              </td>
              <td className="hidden @xl:table-cell">
                <RelativeTime iso={run.finishedAt} />
              </td>
              <td className="text-right">
                <GithubRunLink url={run.githubRunUrl} />
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </section>
  );
}
