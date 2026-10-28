import { PlatformIcon } from "@/components/platform-icon";
import type { IngestionJobStatus, OpsIngestionJob } from "@/lib/operator-contract";
import { cn } from "@/lib/utils";
import { FAILED_TEXT, MONO } from "../constants";
import { DataTable } from "../data-table";
import { IdChip } from "../id-chip";
import { MISSING } from "../lib/format";
import { RelativeTime } from "../relative-time";
import { StatusChip } from "../status-chip";

/** Finished jobs keep a stale next-attempt time that no worker will act on. */
const DONE: ReadonlySet<IngestionJobStatus> = new Set(["completed", "skipped"]);

function Outcome({ job }: { job: OpsIngestionJob }) {
  if (!job.reason && !job.lastError) return <span className="text-muted-foreground">{MISSING}</span>;
  return (
    <div className="flex min-w-0 flex-col">
      {job.reason && (
        <span title={job.reason} className="truncate text-xs text-muted-foreground">
          {job.reason}
        </span>
      )}
      {job.lastError && job.lastError !== job.reason && (
        <span title={job.lastError} className={cn("truncate text-xs", MONO, FAILED_TEXT)}>
          {job.lastError}
        </span>
      )}
    </div>
  );
}

function JobRow({ job }: { job: OpsIngestionJob }) {
  return (
    <tr>
      <td className="max-w-32">
        <IdChip value={job.id} label="Copy job id" />
      </td>
      <td className="w-8 px-1!">
        <PlatformIcon platform={job.platform} className="size-3.5" />
      </td>
      <td className="text-muted-foreground">{job.kind}</td>
      <td className={cn("max-w-44 truncate text-xs", MONO)} title={job.sourceId}>
        {job.sourceId}
      </td>
      <td>
        <StatusChip status={job.status} />
      </td>
      <td className="text-right">{job.attempts}</td>
      <td className="max-w-72 min-w-40">
        <Outcome job={job} />
      </td>
      <td>
        <RelativeTime iso={DONE.has(job.status) ? null : job.nextAttemptAt} />
      </td>
      <td>
        <RelativeTime iso={job.lastAttemptAt} />
      </td>
    </tr>
  );
}

/** Ingestion jobs by latest attempt, with why each waits, skipped or failed. */
export function JobsTable({ jobs }: { jobs: OpsIngestionJob[] }) {
  return (
    <DataTable label="Ingestion jobs">
      <thead>
        <tr>
          <th scope="col">Job</th>
          <th scope="col" className="px-1!">
            <span className="sr-only">Platform</span>
          </th>
          <th scope="col">Kind</th>
          <th scope="col">Source id</th>
          <th scope="col">Status</th>
          <th scope="col" className="text-right!">
            Attempts
          </th>
          <th scope="col">Reason or last error</th>
          <th scope="col">Next attempt</th>
          <th scope="col">Last attempt</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((job) => (
          <JobRow key={job.id} job={job} />
        ))}
      </tbody>
    </DataTable>
  );
}
