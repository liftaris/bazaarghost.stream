import type { OpsDetectionRow } from "@/lib/operator-contract";
import { getPlatform, isKnownPlatform, parsePlatformUrl } from "@/lib/platforms/registry";
import { MISSING } from "./format";

/** How a detection's opponent name reads: the observed text, or why there is none. */
export function detectionName(row: Pick<OpsDetectionRow, "username" | "nameState">): {
  text: string;
  /** Qualifier for partial or unreadable reads; null when the name was read in full. */
  note: string | null;
} {
  const note = row.nameState === "complete" || row.nameState === "legacy" ? null : row.nameState;
  return { text: row.username ?? "Unread name", note };
}

/** `Yes`, `No` or the placeholder for an optional flag. */
export function yesNo(value: boolean | null | undefined): string {
  return value == null ? MISSING : value ? "Yes" : "No";
}

/** `value` or the placeholder when absent. */
export function orMissing(value: string | number | null | undefined): string {
  return value == null || value === "" ? MISSING : String(value);
}

/**
 * The detection's source link moved to `seconds`, in the platform's own `t`
 * format. Links on platforms the registry does not know stay as given.
 */
export function sourceUrlAt(url: string, seconds: number): string {
  const ref = parsePlatformUrl(url);
  if (!ref || !isKnownPlatform(ref.platform)) return url;
  const moved = new URL(url);
  moved.searchParams.set("t", getPlatform(ref.platform).formatTimestamp(seconds));
  return moved.href;
}
