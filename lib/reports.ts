/** What a user report is about, most specific first. */
export type ReportTargetKind = "matchup" | "session" | "streamer" | "page";

/** The thing a report is about, as resolved from the URL and the player. */
export interface ReportTarget {
  kind: ReportTargetKind;
  id: string | null;
  label: string | null;
}

/** Quick-pick reasons, so a report can be filed without typing. */
export const REPORT_CATEGORIES = {
  "wrong-opponent": "Wrong opponent name",
  "wrong-details": "Wrong rank, day or details",
  "wrong-time": "Timestamp is off",
  video: "Video won't play",
  missing: "Missing matchup",
  duplicate: "Duplicate matchup",
  bug: "Something is broken",
  other: "Other",
} as const;

/** One of the {@link REPORT_CATEGORIES} keys. */
export type ReportCategory = keyof typeof REPORT_CATEGORIES;

/** Body of `POST /api/reports`. `context` is an app-state snapshot for whoever triages the report. */
export interface ReportSubmission {
  category: ReportCategory;
  message: string;
  target: ReportTarget;
  context: Record<string, unknown>;
}

/** A stored report: the submission plus server-observed facts. */
export interface StoredReport extends ReportSubmission {
  id: string;
  createdAt: string;
  server: {
    country: string | null;
    userAgent: string | null;
    referer: string | null;
  };
}

export const REPORT_MESSAGE_MAX = 2000;
export const REPORT_BODY_MAX = 64 * 1024;

const KINDS = new Set<ReportTargetKind>([
  "matchup",
  "session",
  "streamer",
  "page",
]);
const short = (v: unknown, max: number) =>
  typeof v === "string" ? v.slice(0, max) : null;

/** Parse an untrusted request body; returns null when it is not a usable report. */
export function parseReport(value: unknown): ReportSubmission | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  const category = body.category;
  if (
    typeof category !== "string" ||
    !Object.hasOwn(REPORT_CATEGORIES, category)
  )
    return null;
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length > REPORT_MESSAGE_MAX) return null;
  if (category === "other" && !message) return null;
  const target = body.target as Record<string, unknown> | null;
  if (
    !target ||
    typeof target !== "object" ||
    !KINDS.has(target.kind as ReportTargetKind)
  )
    return null;
  const context = body.context;
  if (!context || typeof context !== "object" || Array.isArray(context))
    return null;
  return {
    category: category as ReportCategory,
    message,
    target: {
      kind: target.kind as ReportTargetKind,
      id: short(target.id, 120),
      label: short(target.label, 200),
    },
    context: context as Record<string, unknown>,
  };
}
