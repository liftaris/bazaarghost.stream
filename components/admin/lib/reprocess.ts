import { ApiError } from "@/lib/api-client";
import { OpsMutationError, toApiError } from "@/lib/operator-client";
import type {
  ChunkStatus,
  OperatorRunInputs,
  OpsChunk,
  OpsReprocessResponse,
  OpsRunDefaults,
  ProcessorMode,
  RunInputs,
  RunQuality,
} from "@/lib/operator-contract";

/** Most chunks one reprocess request accepts. */
export const MAX_REPROCESS = 50;

/** How each processor mode reads in the console. */
export const MODE_LABEL: Record<ProcessorMode, string> = { legacy: "Legacy", next: "Next" };

/** How each quality reads in the console; keys are every quality the backend accepts. */
export const QUALITY_LABEL: Record<RunQuality, string> = {
  "360p": "360p",
  "360p60": "360p · 60 fps",
  "480p": "480p",
  "480p60": "480p · 60 fps",
  "720p": "720p",
  "720p60": "720p · 60 fps",
  "1080p": "1080p",
  "1080p60": "1080p · 60 fps",
};

/** Every quality, lowest first, for the quality select. */
export const RUN_QUALITIES = Object.keys(QUALITY_LABEL) as RunQuality[];

/** Mode and quality of a run as one label, such as `Legacy · 480p`. */
export function runInputsLabel(inputs: Pick<RunInputs, "mode" | "quality">): string {
  return `${MODE_LABEL[inputs.mode]} · ${QUALITY_LABEL[inputs.quality]}`;
}

/** Why a chunk in each status cannot be rerun, or null when it can. Mirrors the backend's resettable statuses. */
/** Why a rerun cannot start for this environment, from the server's `configError`; null when it can. */
export function configBlock(defaults: OpsRunDefaults): string | null {
  return defaults.configError ? `Reruns are unavailable here: ${defaults.configError}` : null;
}

export const REPROCESS_BLOCK: Record<ChunkStatus, string | null> = {
  pending: null,
  completed: null,
  failed: null,
  queued: "Already queued. Rerun it after this run finishes.",
  processing: "Processing now. Rerun it after this run finishes.",
  archived: "Archived chunks cannot be rerun.",
};

/** True when a chunk in this status can be queued again. */
export const canReprocess = (status: ChunkStatus): boolean => REPROCESS_BLOCK[status] === null;

/** The inputs a new run starts from: the operator-chosen part of the backend's defaults. */
export function startingInputs(defaults: OpsRunDefaults): OperatorRunInputs {
  return { mode: defaults.inputs.mode, quality: defaults.inputs.quality };
}

/** Chunk ids the operator has ticked for a bulk rerun. */
export type ChunkSelection = ReadonlySet<string>;

/**
 * The selected chunk that supplies bulk defaults: the earliest selected chunk in table order.
 * Bulk reruns send one set of inputs, so they start from that chunk's `runDefaults`.
 */
export function defaultsChunk(chunks: readonly OpsChunk[], selection: ChunkSelection): string | null {
  return chunks.find((chunk) => selection.has(chunk.id))?.id ?? null;
}

/** Tick or untick a chunk; chunks that cannot be rerun and ticks past {@link MAX_REPROCESS} are ignored. */
export function toggleChunk(selection: ChunkSelection, chunk: Pick<OpsChunk, "id" | "status">): ChunkSelection {
  const next = new Set(selection);
  if (next.delete(chunk.id)) return next;
  if (!canReprocess(chunk.status) || next.size >= MAX_REPROCESS) return selection;
  return next.add(chunk.id);
}

/** Tick every chunk that can be rerun, up to {@link MAX_REPROCESS} in table order, or clear when all are ticked. */
export function toggleAll(selection: ChunkSelection, chunks: readonly OpsChunk[]): ChunkSelection {
  const eligible = chunks.filter((chunk) => canReprocess(chunk.status)).slice(0, MAX_REPROCESS);
  return eligible.every((chunk) => selection.has(chunk.id)) ? new Set() : new Set(eligible.map((chunk) => chunk.id));
}

/** How much of the eligible list is ticked, for the select-all checkbox. */
export type SelectionCoverage = "none" | "some" | "all";

/** Whether no, some or every chunk that can be rerun (up to {@link MAX_REPROCESS}) is ticked. */
export function selectionCoverage(selection: ChunkSelection, chunks: readonly OpsChunk[]): SelectionCoverage {
  if (selection.size === 0) return "none";
  const eligible = chunks.filter((chunk) => canReprocess(chunk.status)).slice(0, MAX_REPROCESS);
  return eligible.every((chunk) => selection.has(chunk.id)) ? "all" : "some";
}

/** Drop ticks for chunks that left the list or can no longer be rerun; returns the same set when nothing changed. */
export function pruneSelection(selection: ChunkSelection, chunks: readonly OpsChunk[]): ChunkSelection {
  const keep = new Set(chunks.filter((chunk) => selection.has(chunk.id) && canReprocess(chunk.status)).map((chunk) => chunk.id));
  return keep.size === selection.size ? selection : keep;
}

/** Names a chunk in results. */
export type ChunkLabel = (id: string) => string;

/** Label chunks by index, such as `Chunk 3`; ids outside the list show their first eight characters. */
export function chunkLabeller(chunks: readonly Pick<OpsChunk, "id" | "index">[]): ChunkLabel {
  const index = new Map(chunks.map((chunk) => [chunk.id, chunk.index]));
  return (id) => {
    const found = index.get(id);
    return found === undefined ? id.slice(0, 8) : `Chunk ${found}`;
  };
}

/** Counts across every recording of a reprocess response. */
export interface ReprocessSummary {
  queued: number;
  skipped: number;
  /** Recordings that failed as a whole, for example when GitHub refused their dispatch. */
  failed: number;
}

/** Sum queued and skipped chunks and failed recordings. */
export function summariseReprocess(response: Pick<OpsReprocessResponse, "recordings">): ReprocessSummary {
  return response.recordings.reduce(
    (sum, recording) => ({
      queued: sum.queued + recording.chunkIds.length,
      skipped: sum.skipped + recording.skipped.length,
      failed: sum.failed + (recording.error ? 1 : 0),
    }),
    { queued: 0, skipped: 0, failed: 0 },
  );
}

const chunks = (n: number) => `${n} ${n === 1 ? "chunk" : "chunks"}`;

/** One line for a toast or heading, such as `Queued 2 chunks, 1 skipped`. */
export function describeReprocess(summary: ReprocessSummary, dryRun: boolean): string {
  const head = dryRun ? `${chunks(summary.queued)} would queue` : `Queued ${chunks(summary.queued)}`;
  const tail = [summary.skipped && `${summary.skipped} skipped`, summary.failed && `${summary.failed} recording failed`];
  return [head, ...tail.filter(Boolean)].join(", ");
}

/** A reprocess request the console could not complete, by what the operator can do about it. */
export type ReprocessFailure =
  | { kind: "session"; message: string }
  | { kind: "refused"; status: 409 | 502; message: string; response: OpsReprocessResponse | null }
  | { kind: "error"; error: ApiError };

/** Classify a thrown reprocess error: expired session or CSRF, a refusal with per-recording results, or anything else. */
export function classifyReprocessFailure(error: unknown): ReprocessFailure {
  if (!(error instanceof ApiError)) return { kind: "error", error: toApiError(error) };
  if (error.status === 401 || error.status === 403) return { kind: "session", message: error.message };
  if (error.status === 409 || error.status === 502)
    return {
      kind: "refused",
      status: error.status,
      message: error.message,
      response: error instanceof OpsMutationError ? (error.body as OpsReprocessResponse | null) : null,
    };
  return { kind: "error", error };
}
