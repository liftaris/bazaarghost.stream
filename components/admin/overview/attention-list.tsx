import Link from "next/link";
import type { OpsAttention, OpsAttentionKind } from "@/lib/operator-contract";
import { cn } from "@/lib/utils";
import { ATTENTION, FAILED_TEXT, MONO } from "../constants";
import { activityHref } from "../lib/activity-filters";
import { formatCount, formatDateTime, formatRelative } from "../lib/format";
import { EmptyState } from "../load-states";

const CHUNK_KINDS: ReadonlySet<OpsAttentionKind> = new Set(["exhausted_chunk", "expired_lease", "stale_queued"]);
const LINK = "rounded-sm focus-visible:outline-2 focus-visible:outline-ring";

function AttentionRow({ group }: { group: OpsAttention }) {
  const { label, href } = ATTENTION[group.kind];
  const groupHref = CHUNK_KINDS.has(group.kind)
    ? activityHref({ status: "attention" })
    : group.samples[0]
      ? href(group.samples[0])
      : null;
  const count = <span className="text-sm font-semibold tabular-nums">{formatCount(group.count)}</span>;
  return (
    <li className="grid gap-x-4 gap-y-1 px-3 py-2.5 @2xl:grid-cols-[14rem_minmax(0,1fr)]">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        {groupHref ? (
          <Link href={groupHref} className={cn(LINK, "hover:underline")}>
            {count}
          </Link>
        ) : (
          count
        )}
      </div>
      <ul className="flex min-w-0 flex-col">
        {group.samples.map((sample) => (
          <li key={sample.id} className="min-w-0">
            <Link
              href={href(sample)}
              className={cn(LINK, "grid grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto] items-baseline gap-3 px-1 py-0.5 text-sm hover:bg-muted")}
            >
              <span className="truncate">{sample.label}</span>
              <span className={cn("truncate text-xs", MONO, FAILED_TEXT)} title={sample.error ?? undefined}>
                {sample.error}
              </span>
              <time
                dateTime={sample.at ?? undefined}
                title={formatDateTime(sample.at)}
                className="text-xs whitespace-nowrap text-muted-foreground tabular-nums"
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
