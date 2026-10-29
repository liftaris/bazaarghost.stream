import Link from "../console-link";
import type { OpsAttention } from "@/lib/operator-contract";
import { cn } from "@/lib/utils";
import { FAILED_TEXT, MONO } from "../constants";
import { ATTENTION, attentionSampleHref } from "../lib/attention";
import { formatCount, formatDateTime, formatRelative } from "../lib/format";
import { EmptyState } from "../load-states";

const LINK = "rounded-sm focus-visible:outline-2 focus-visible:outline-ring";

function AttentionRow({ group }: { group: OpsAttention }) {
  const { label, href } = ATTENTION[group.kind];
  return (
    <li className="grid gap-x-4 gap-y-1 px-3 py-2.5 @2xl:grid-cols-[14rem_minmax(0,1fr)]">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <Link href={href} className={cn(LINK, "hover:underline pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:min-w-11 pointer-coarse:items-center pointer-coarse:justify-end")}>
          <span className="text-sm font-semibold tabular-nums">{formatCount(group.count)}</span>
        </Link>
      </div>
      <ul className="flex min-w-0 flex-col">
        {group.samples.map((sample) => (
          <li key={sample.id} className="min-w-0">
            <Link
              href={attentionSampleHref(sample)}
              className={cn(
                LINK,
                "grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 px-1 py-1.5 text-sm hover:bg-muted @2xl:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto] @2xl:py-0.5",
              )}
            >
              <span className="truncate">{sample.label}</span>
              {sample.error && (
                <span
                  className={cn("col-span-full row-start-2 truncate text-xs @2xl:col-span-1 @2xl:row-start-auto", MONO, FAILED_TEXT)}
                  title={sample.error}
                >
                  {sample.error}
                </span>
              )}
              <time
                dateTime={sample.at ?? undefined}
                title={formatDateTime(sample.at)}
                className="col-start-2 row-start-1 text-xs whitespace-nowrap text-muted-foreground tabular-nums @2xl:col-start-3"
              >
                {sample.at && formatRelative(sample.at)}
              </time>
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}

/** Problem groups as dense rows: what kind, how many, and the newest examples to open. */
export function AttentionList({ attention }: { attention: OpsAttention[] }) {
  const open = attention.filter((group) => group.count > 0);
  return (
    <section aria-labelledby="attention-heading" className="@container flex flex-col gap-2">
      <h2 id="attention-heading" className="text-sm font-semibold">
        Needs attention
      </h2>
      {open.length ? (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {open.map((group) => (
            <AttentionRow key={group.kind} group={group} />
          ))}
        </ul>
      ) : (
        <EmptyState title="Nothing needs attention right now">
          Exhausted chunks, expired leases, stale queues and failing ingestion show up here.
        </EmptyState>
      )}
    </section>
  );
}
