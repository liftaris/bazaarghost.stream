import type { OpsRun, RunOrigin } from "@/lib/operator-contract";

/** How each run origin reads in the console. */
export const RUN_ORIGIN: Record<RunOrigin, string> = {
  automatic: "Automatic",
  operator: "Operator",
  manual: "Manual",
};

/** The signed-in operator, to name their own runs. */
export interface Viewer {
  userId: string;
  name: string;
}

/**
 * Who asked for a run: the scheduler, an operator by name when it is the viewer or by user id
 * otherwise (the contract carries no operator names), or a manual claim.
 */
export function runOrigin(run: Pick<OpsRun, "origin" | "requestedBy">, viewer: Viewer | null): string {
  if (run.origin !== "operator" || !run.requestedBy) return RUN_ORIGIN[run.origin];
  return run.requestedBy === viewer?.userId ? viewer.name : run.requestedBy;
}
