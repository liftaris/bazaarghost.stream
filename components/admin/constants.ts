import {
  Archive,
  Circle,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleMinus,
  CircleSlash,
  CircleX,
  Clock,
  Contrast,
  CloudDownload,
  Gauge,
  Hourglass,
  ListChecks,
  LoaderCircle,
  TimerOff,
  Unplug,
  Users,
  type LucideIcon,
} from "lucide-react";
import type {
  CatalogWorkState,
  ChunkStatus,
  IngestionJobStatus,
  InventoryState,
  RecordingStatus,
  RunStatus,
} from "@/lib/operator-contract";

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

/** Every status the console shows: chunks, runs, recordings, ingestion jobs, catalog work and platform inventory. */
export type Status = ChunkStatus | RunStatus | RecordingStatus | IngestionJobStatus | CatalogWorkState | InventoryState;

/**
 * The one status vocabulary across the console. Orange means work is active,
 * destructive means failed, foreground with a check means done, muted means
 * waiting, skipped or not yet seen.
 */
export const STATUS: Record<Status, StatusStyle> = {
  not_seen: { label: "Not scanned", icon: CircleDashed, text: "text-muted-foreground", fill: "bg-muted-foreground/20" },
  skipped: { label: "Skipped", icon: CircleSlash, text: "text-muted-foreground", fill: "bg-muted-foreground/15" },
  idle: { label: "Idle", icon: CircleMinus, text: "text-muted-foreground", fill: "bg-muted-foreground/15" },
  waiting: { label: "Waiting", icon: Hourglass, text: "text-muted-foreground", fill: "bg-muted-foreground/35" },
  pending: { label: "Pending", icon: Circle, text: "text-muted-foreground", fill: "bg-muted-foreground/35" },
  cataloged: { label: "Cataloged", icon: CircleDot, text: "text-muted-foreground", fill: "bg-muted-foreground/50" },
  queued: { label: "Queued", icon: Clock, text: ACTIVE_TEXT, fill: "bg-primary/60" },
  processing: { label: "Processing", icon: LoaderCircle, text: ACTIVE_TEXT, fill: "bg-primary" },
  running: { label: "Running", icon: LoaderCircle, text: ACTIVE_TEXT, fill: "bg-primary" },
  partial: { label: "Partial", icon: Contrast, text: "text-foreground", fill: "bg-foreground/45" },
  completed: { label: "Completed", icon: CircleCheck, text: "text-foreground", fill: "bg-foreground/75" },
  processed: { label: "Processed", icon: CircleCheck, text: "text-foreground", fill: "bg-foreground/75" },
  failed: { label: "Failed", icon: CircleX, text: FAILED_TEXT, fill: "bg-destructive" },
  dispatch_failed: { label: "Dispatch failed", icon: Unplug, text: FAILED_TEXT, fill: "bg-destructive" },
  expired: { label: "Expired", icon: TimerOff, text: FAILED_TEXT, fill: "bg-destructive/70" },
  archived: { label: "Archived", icon: Archive, text: "text-muted-foreground", fill: "bg-muted-foreground/15" },
};

/** Chunk statuses in pipeline order, left to right. */
export const CHUNK_PIPELINE: readonly ChunkStatus[] = ["pending", "queued", "processing", "completed", "failed"];

/** Recording statuses in pipeline order, left to right. */
export const RECORDING_PIPELINE: readonly RecordingStatus[] = ["pending", "processing", "partial", "completed", "failed"];

/** Console sections in nav order. */
export const SECTIONS = [
  { href: "/admin", label: "Overview", icon: Gauge },
  { href: "/admin/activity", label: "Activity", icon: ListChecks },
  { href: "/admin/streamers", label: "Streamers", icon: Users },
  { href: "/admin/ingestion", label: "Ingestion", icon: CloudDownload },
] as const satisfies readonly { href: string; label: string; icon: LucideIcon }[];
