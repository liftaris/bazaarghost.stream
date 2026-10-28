"use client";

import { useId, useState, type ReactNode } from "react";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { OpsRunDefaults } from "@/lib/operator-contract";
import { startingInputs, type ChunkLabel } from "../lib/reprocess";
import { useReprocess, type ReprocessAction } from "./hooks/use-reprocess";
import { ReprocessOutcome } from "./reprocess-outcome";
import { RunInputsFields } from "./run-inputs-fields";

const ACTIONS: ReadonlyArray<{ action: ReprocessAction; label: string; variant: "outline" | "default" }> = [
  { action: "preview", label: "Preview", variant: "outline" },
  { action: "queue", label: "Queue rerun", variant: "default" },
];

/**
 * Rerun chunks inline: mode and quality starting from `defaults`, read-only facts about what the
 * run keeps and records, a dry-run preview of the workflow payload, and the queue action.
 * Inputs start from `defaults` once; remount with a `key` to start over.
 */
export function ReprocessPanel({
  title,
  chunkIds,
  defaults,
  blocked,
  facts,
  chunkLabel,
}: {
  title: ReactNode;
  chunkIds: readonly string[];
  defaults: OpsRunDefaults;
  /** Why these chunks cannot be rerun now; disables the form. */
  blocked: string | null;
  facts?: ReactNode;
  chunkLabel: ChunkLabel;
}) {
  const headingId = useId();
  const [inputs, setInputs] = useState(() => startingInputs(defaults));
  const { state, stale, run } = useReprocess({ chunkIds, inputs });
  const pending = state.phase === "pending";
  const disabled = pending || blocked !== null || chunkIds.length === 0;

  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-3">
      <h3 id={headingId} className="text-sm font-semibold">
        {title}
      </h3>
      {blocked && (
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <Ban aria-hidden className="mt-0.5 size-4 shrink-0" />
          {blocked}
        </p>
      )}
      <RunInputsFields
        value={inputs}
        allowedModes={defaults.allowedModes}
        disabled={blocked !== null || pending}
        onChange={setInputs}
      />
      {facts}
      <p className="text-xs text-muted-foreground">Runs once. If it fails it stays failed until you queue it again.</p>
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map(({ action, label, variant }) => (
          <Button key={action} variant={variant} size="sm" disabled={disabled} onClick={() => run(action)}>
            {pending && state.action === action && <Spinner aria-hidden />}
            {label}
          </Button>
        ))}
      </div>
      <ReprocessOutcome state={state} stale={stale} chunkLabel={chunkLabel} onRetry={run} />
    </section>
  );
}
