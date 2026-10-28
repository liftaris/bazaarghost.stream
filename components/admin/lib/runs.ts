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

/** Who asked for a run, as a label plus the operator's user id when the console cannot name them. */
export interface RunRequester {
  label: string;
  /** Set for another operator's run; the contract carries user ids, not operator names. */
  userId: string | null;
}

/** Name the scheduler, a manual claim, the viewer by name, or another operator by user id. */
export function runOrigin(run: Pick<OpsRun, "origin" | "requestedBy">, viewer: Viewer | null): RunRequester {
  if (run.origin !== "operator" || !run.requestedBy) return { label: RUN_ORIGIN[run.origin], userId: null };
  if (run.requestedBy === viewer?.userId) return { label: `${RUN_ORIGIN.operator} · ${viewer.name}`, userId: null };
  return { label: RUN_ORIGIN.operator, userId: run.requestedBy };
}
