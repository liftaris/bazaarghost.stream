"use client";

import type { ReactNode } from "react";
import Link from "../console-link";
import { usePathname, useSearchParams } from "next/navigation";
import { CircleAlert } from "lucide-react";
import type { OpsReprocessResponse } from "@/lib/operator-contract";
import { cn } from "@/lib/utils";
import { FAILED_TEXT } from "../constants";
import { describeReprocess, summariseReprocess, type ChunkLabel, type ReprocessFailure } from "../lib/reprocess";
import { signInHref } from "../lib/sign-in";
import { ErrorState } from "../load-states";
import type { ReprocessAction, ReprocessState } from "./hooks/use-reprocess";
import { RecordingResult } from "./recording-result";

const BOX = "flex min-w-0 flex-col gap-3 rounded-md border border-border p-3";

function Results({ response, dryRun, chunkLabel }: { response: OpsReprocessResponse; dryRun: boolean; chunkLabel: ChunkLabel }) {
  return response.recordings.map((result) => (
    <RecordingResult key={result.recordingId} result={result} dryRun={dryRun} chunkLabel={chunkLabel} />
  ));
}

function Alert({ title, message, children }: { title: string; message: string; children?: ReactNode }) {
  return (
    <div role="alert" className={BOX}>
      <div className="flex flex-col gap-1">
        <p className="flex items-center gap-2 text-sm font-medium">
          <CircleAlert aria-hidden className={cn("size-4 shrink-0", FAILED_TEXT)} />
          {title}
        </p>
        <p className="text-sm break-words text-muted-foreground">{message}</p>
      </div>
      {children}
    </div>
  );
}

function SessionExpired({ message }: { message: string }) {
  const href = signInHref(usePathname(), useSearchParams().toString());
  return (
    <Alert title="Your session has expired. Sign in again to queue reruns." message={message}>
      <Link
        href={href}
        className="self-start text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
      >
        Sign in again
      </Link>
    </Alert>
  );
}

const REFUSED_TITLE = { 409: "Nothing was queued", 502: "GitHub refused the dispatch" } as const;

function Failure({
  failure,
  dryRun,
  chunkLabel,
  onRetry,
}: {
  failure: ReprocessFailure;
  dryRun: boolean;
  chunkLabel: ChunkLabel;
  onRetry: () => void;
}) {
  switch (failure.kind) {
    case "session":
      return <SessionExpired message={failure.message} />;
    case "refused":
      return (
        <Alert title={dryRun ? "Nothing would queue" : REFUSED_TITLE[failure.status]} message={failure.message}>
          {failure.response && <Results response={failure.response} dryRun={dryRun} chunkLabel={chunkLabel} />}
        </Alert>
      );
    case "error":
      return (
        <ErrorState
          title={dryRun ? "Could not preview this rerun" : "Could not queue this rerun"}
          error={failure.error}
          onRetry={onRetry}
        />
      );
  }
}

/**
 * What the last preview or queue returned. A preview disappears once the chunks or inputs change;
 * a queue result stays until the next action.
 */
export function ReprocessOutcome({
  state,
  stale,
  chunkLabel,
  onRetry,
}: {
  state: ReprocessState;
  stale: boolean;
  chunkLabel: ChunkLabel;
  onRetry: (action: ReprocessAction) => void;
}) {
  if (state.phase !== "settled" || (stale && state.action === "preview")) return null;
  const dryRun = state.action === "preview";
  const { outcome } = state;
  if (!outcome.ok)
    return <Failure failure={outcome.failure} dryRun={dryRun} chunkLabel={chunkLabel} onRetry={() => onRetry(state.action)} />;
  return (
    <div role="status" className={BOX}>
      <p className="text-sm font-medium">{describeReprocess(summariseReprocess(outcome.response), dryRun)}</p>
      <Results response={outcome.response} dryRun={dryRun} chunkLabel={chunkLabel} />
    </div>
  );
}
