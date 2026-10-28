"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { opsPost } from "@/lib/operator-client";
import type { OperatorRunInputs, OpsReprocessResponse } from "@/lib/operator-contract";
import { invalidateOpsResources } from "../../hooks/use-ops-resource";
import {
  classifyReprocessFailure,
  describeReprocess,
  summariseReprocess,
  type ReprocessFailure,
} from "../../lib/reprocess";

/** Preview asks for a dry run; queue dispatches. */
export type ReprocessAction = "preview" | "queue";

/** What a settled request returned: the per-recording results, or why it failed. */
export type ReprocessOutcome = { ok: true; response: OpsReprocessResponse } | { ok: false; failure: ReprocessFailure };

/** One reprocess request's lifecycle; `request` keys the chunk ids and inputs it was sent with. */
export type ReprocessState =
  | { phase: "idle" }
  | { phase: "pending"; action: ReprocessAction; request: string }
  | { phase: "settled"; action: ReprocessAction; request: string; outcome: ReprocessOutcome };

/** The chunks and inputs a request would send. */
export interface ReprocessRequest {
  chunkIds: readonly string[];
  inputs: OperatorRunInputs;
}

/** The reprocess state for the current request and the two actions. */
export interface Reprocess {
  state: ReprocessState;
  /** True when the settled state answered a different request than the current one. */
  stale: boolean;
  run: (action: ReprocessAction) => void;
}

/**
 * Send dry runs and reruns for the current chunks and inputs. A queue that reached the server
 * refetches every console read so rows and run history show the new state.
 * @returns {@link Reprocess}
 */
export function useReprocess({ chunkIds, inputs }: ReprocessRequest): Reprocess {
  const { state: auth } = useAuth();
  const csrf = auth.status === "authenticated" ? auth.identity.csrfToken : "";
  const [state, setState] = useState<ReprocessState>({ phase: "idle" });
  const request = JSON.stringify([chunkIds, inputs.mode, inputs.quality]);

  const run = async (action: ReprocessAction) => {
    setState({ phase: "pending", action, request });
    const dryRun = action === "preview";
    const outcome: ReprocessOutcome = await opsPost(
      "/reprocess",
      { chunk_ids: [...chunkIds], inputs, dry_run: dryRun },
      csrf,
    ).then(
      (response) => ({ ok: true, response }),
      (error: unknown) => ({ ok: false, failure: classifyReprocessFailure(error) }),
    );
    setState({ phase: "settled", action, request, outcome });
    if (dryRun) return;
    if (outcome.ok) toast.success(describeReprocess(summariseReprocess(outcome.response), false));
    const offline = !outcome.ok && outcome.failure.kind === "error" && outcome.failure.error.status === 0;
    if (!offline) invalidateOpsResources();
  };

  return {
    state,
    stale: state.phase !== "idle" && state.request !== request,
    run: (action) => void run(action),
  };
}
