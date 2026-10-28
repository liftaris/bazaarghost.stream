import { format, formatDistanceToNowStrict } from "date-fns";

/** Placeholder for a value the backend does not have. */
export const MISSING = "-";

/** Recording position as `h:mm:ss` or `m:ss`. */
export function formatTimecode(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

/** A length of time as `42s`, `4m 12s` or `1h 03m`. */
export function formatSeconds(seconds: number | null): string {
  if (seconds == null || !Number.isFinite(seconds)) return MISSING;
  const total = Math.round(seconds);
  if (total < 60) return `${total}s`;
  if (total < 3600) return `${Math.floor(total / 60)}m ${String(total % 60).padStart(2, "0")}s`;
  return `${Math.floor(total / 3600)}h ${String(Math.floor((total % 3600) / 60)).padStart(2, "0")}m`;
}

/** Milliseconds shown with {@link formatSeconds}. */
export function formatMs(ms: number | null): string {
  return ms == null ? MISSING : formatSeconds(ms / 1000);
}

/** Relative time such as `5 minutes ago`. */
export function formatRelative(iso: string | null): string {
  return iso ? formatDistanceToNowStrict(new Date(iso), { addSuffix: true }) : MISSING;
}

/** Absolute local date and time, for titles and fact lists. */
export function formatDateTime(iso: string | null): string {
  return iso ? format(new Date(iso), "PP p") : MISSING;
}

/** A count with thousands separators, or the placeholder. */
export function formatCount(value: number | null | undefined): string {
  return value == null ? MISSING : value.toLocaleString("en-US");
}
