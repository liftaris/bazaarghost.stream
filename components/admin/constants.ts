import {
  Archive,
  Circle,
  CircleCheck,
  CircleX,
  Clock,
  Contrast,
  CloudDownload,
  Gauge,
  ListChecks,
  LoaderCircle,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ChunkStatus, OpsAttention, OpsAttentionKind, RecordingStatus } from "@/lib/operator-contract";
import type { ActivityStatus } from "./lib/activity-filters";
import { withInspect } from "./lib/inspect";

/** JetBrains Mono, reserved for ids, timecodes, errors and payloads. */
export const MONO = "font-[family-name:var(--font-jetbrains-mono)]";

/** Orange text for active work, darkened or lightened toward the foreground for contrast. */
export const ACTIVE_TEXT = "text-[color-mix(in_srgb,var(--primary)_55%,var(--foreground))]";
/** Destructive text for failures, mixed toward the foreground for contrast. */
export const FAILED_TEXT = "text-[color-mix(in_srgb,var(--destructive)_65%,var(--foreground))]";

/** How a status reads everywhere: chip text, icon, and the fill of bars and timeline blocks. */
export interface StatusStyle {
  label: string;
  icon: LucideIcon;
  /** Text colour for chips and inline labels; meets 4.5:1 on cream and charcoal. */
  text: string;
  /** Background for bars, blocks and legend swatches. */
  fill: string;
}

/**
 * The one status vocabulary for chunks and recordings. Orange means work is
 * active, destructive means failed, foreground with a check means done, muted
 * means waiting or retired.
 */
export const STATUS: Record<ChunkStatus | RecordingStatus, StatusStyle> = {
  pending: { label: "Pending", icon: Circle, text: "text-muted-foreground", fill: "bg-muted-foreground/35" },
  queued: { label: "Queued", icon: Clock, text: ACTIVE_TEXT, fill: "bg-primary/60" },
  processing: { label: "Processing", icon: LoaderCircle, text: ACTIVE_TEXT, fill: "bg-primary" },
  partial: { label: "Partial", icon: Contrast, text: "text-foreground", fill: "bg-foreground/45" },
  completed: { label: "Completed", icon: CircleCheck, text: "text-foreground", fill: "bg-foreground/75" },
  failed: { label: "Failed", icon: CircleX, text: FAILED_TEXT, fill: "bg-destructive" },
  archived: { label: "Archived", icon: Archive, text: "text-muted-foreground", fill: "bg-muted-foreground/15" },
};

/** Chunk statuses in pipeline order, left to right. */
export const CHUNK_PIPELINE: readonly ChunkStatus[] = ["pending", "queued", "processing", "completed", "failed"];

/** Recording statuses in pipeline order, left to right. */
export const RECORDING_PIPELINE: readonly RecordingStatus[] = ["pending", "processing", "partial", "completed", "failed"];

/**
 * The recording filter that best answers "show me these chunks". The recordings
 * route filters by recording status only, so failed chunks map to `attention`.
 */
export const CHUNK_STAGE_FILTER: Record<ChunkStatus, ActivityStatus | null> = {
  pending: "pending",
  queued: "processing",
  processing: "processing",
  completed: "completed",
  failed: "attention",
  archived: null,
};

type AttentionSample = OpsAttention["samples"][number];

const chunkHref = (sample: AttentionSample) =>
  sample.recordingId == null
    ? `/admin/activity${withInspect("", { kind: "chunk", id: sample.id })}`
    : `/admin/recordings/${sample.recordingId}${withInspect("", { kind: "chunk", id: sample.id })}`;

/** Label and sample destination for each attention group the overview lists. */
export const ATTENTION: Record<OpsAttentionKind, { label: string; href: (sample: AttentionSample) => string }> = {
  exhausted_chunk: { label: "Chunks out of retries", href: chunkHref },
  expired_lease: { label: "Expired leases", href: chunkHref },
  stale_queued: { label: "Stale in queue", href: chunkHref },
  dispatch_unconfirmed: {
    label: "Dispatch unconfirmed",
    href: (sample) => (sample.recordingId == null ? "/admin/ingestion" : `/admin/recordings/${sample.recordingId}`),
  },
  failing_ingestion: { label: "Failing ingestion jobs", href: () => "/admin/ingestion" },
  catalog_failed: { label: "Catalog failures", href: (sample) => `/admin/streamers/${sample.id}` },
};

/** Console sections in nav order. */
export const SECTIONS = [
  { href: "/admin", label: "Overview", icon: Gauge },
  { href: "/admin/activity", label: "Activity", icon: ListChecks },
  { href: "/admin/streamers", label: "Streamers", icon: Users },
  { href: "/admin/ingestion", label: "Ingestion", icon: CloudDownload },
] as const satisfies readonly { href: string; label: string; icon: LucideIcon }[];
