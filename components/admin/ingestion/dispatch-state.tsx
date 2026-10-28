import { ExternalLink } from "lucide-react";
import type { OpsIngestion } from "@/lib/operator-contract";
import { cn } from "@/lib/utils";
import { FAILED_TEXT } from "../constants";
import { FactList } from "../data-table";
import { formatCount, MISSING } from "../lib/format";
import { EmptyState } from "../load-states";
import { RelativeTime } from "../relative-time";
import { StatusChip } from "../status-chip";

type Dispatch = NonNullable<OpsIngestion["dispatch"]>;

const OUTCOME: Record<NonNullable<Dispatch["outcome"]>, { label: string; failed: boolean }> = {
  accepted: { label: "Accepted by GitHub", failed: false },
  delivery_unconfirmed: { label: "Delivery unconfirmed", failed: true },
  success: { label: "Succeeded", failed: false },
  failure: { label: "Failed", failed: true },
  cancelled: { label: "Cancelled", failed: true },
};

/** The ingestion dispatch singleton: state, last outcome, timing, delivery failures and the GitHub run. */
export function DispatchState({ dispatch }: { dispatch: OpsIngestion["dispatch"] }) {
  if (!dispatch)
    return (
      <EmptyState title="No dispatch recorded yet">
        The first scheduled ingestion run writes its state here, with a link to its GitHub Actions run.
      </EmptyState>
    );
  const outcome = dispatch.outcome && OUTCOME[dispatch.outcome];
  return (
    <FactList
      className="rounded-lg border border-border p-3"
      facts={[
        ["State", <StatusChip status={dispatch.state} />],
        ["Outcome", outcome ? <span className={cn(outcome.failed && FAILED_TEXT)}>{outcome.label}</span> : MISSING],
        ["Started", <RelativeTime iso={dispatch.startedAt} />],
        ["Finished", <RelativeTime iso={dispatch.finishedAt} />],
        [
          "Delivery failures",
          <span className={cn(dispatch.deliveryFailures > 0 && FAILED_TEXT)}>{formatCount(dispatch.deliveryFailures)}</span>,
        ],
        [
          "GitHub run",
          dispatch.runUrl ? (
            <a
              href={dispatch.runUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring pointer-coarse:min-h-11"
            >
              Open run
              <ExternalLink aria-hidden className="size-3 text-muted-foreground" />
            </a>
          ) : (
            MISSING
          ),
        ],
      ]}
    />
  );
}
