import { format } from "date-fns";
import type { OpsOverview } from "@/lib/operator-contract";
import { cn } from "@/lib/utils";
import { STATUS } from "../constants";
import { formatCount } from "../lib/format";
import { throughputColumns, throughputTotals } from "./lib/throughput";

const hour = (iso: string) => format(new Date(iso), "HH:mm");

function Swatch({ fill, label }: { fill: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden className={cn("size-2.5 rounded-sm", fill)} />
      {label}
    </span>
  );
}

/** 24 hourly columns of completed and failed chunks, with a screen-reader table of the same data. */
export function ThroughputBars({ throughput }: { throughput: OpsOverview["throughput"] }) {
  const columns = throughputColumns(throughput);
  const totals = throughputTotals(throughput);
  return (
    <section aria-labelledby="throughput-heading" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="throughput-heading" className="text-sm font-semibold">
          Chunks finished, last 24 hours
        </h2>
        <div className="flex items-center gap-4 text-xs text-muted-foreground tabular-nums">
          <Swatch fill={STATUS.completed.fill} label={`${formatCount(totals.completed)} completed`} />
          <Swatch fill={STATUS.failed.fill} label={`${formatCount(totals.failed)} failed`} />
        </div>
      </div>
      <div aria-hidden className="flex flex-col gap-1 rounded-lg border border-border p-3">
        <div className="flex h-28 items-end gap-0.5">
          {columns.map((column) => (
            <div
              key={column.hour}
              title={`${hour(column.hour)}: ${column.completed} completed, ${column.failed} failed`}
              className="flex h-full min-w-0 flex-1 flex-col-reverse rounded-sm bg-muted/60"
            >
              <div className={cn("w-full", STATUS.completed.fill)} style={{ height: `${column.completedHeight}%` }} />
              <div className={cn("w-full", STATUS.failed.fill)} style={{ height: `${column.failedHeight}%` }} />
            </div>
          ))}
        </div>
        <div className="flex gap-0.5 text-[11px] text-muted-foreground tabular-nums">
          {columns.map((column, i) => (
            <span key={column.hour} className="min-w-0 flex-1 overflow-visible whitespace-nowrap">
              {i % 6 === 0 ? hour(column.hour) : ""}
            </span>
          ))}
        </div>
      </div>
      <table className="sr-only">
        <caption>Chunks finished per hour</caption>
        <thead>
          <tr>
            <th scope="col">Hour starting</th>
            <th scope="col">Completed</th>
            <th scope="col">Failed</th>
          </tr>
        </thead>
        <tbody>
          {throughput.map((bucket) => (
            <tr key={bucket.hour}>
              <th scope="row">{hour(bucket.hour)}</th>
              <td>{bucket.completed}</td>
              <td>{bucket.failed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
