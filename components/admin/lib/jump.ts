import { parsePlatformUrl } from "@/lib/platforms/registry";
import { activityHref } from "./activity-filters";
import { parseInspect, withInspect, type InspectTarget } from "./inspect";

/** Where a jump-box entry leads. `source` may resolve to one recording before falling back to search. */
export type JumpTarget =
  | { kind: "recording"; id: number }
  | InspectTarget
  | { kind: "source"; platform: string; sourceId: string }
  | { kind: "search"; q: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BILIBILI_BV = /^BV[0-9A-Za-z]{10}$/;

/**
 * Classify a pasted value: a recording id, a chunk UUID, an explicit `chunk:` or
 * `detection:` reference, a platform VOD URL or Bilibili BV id, or free text.
 */
export function parseJump(input: string): JumpTarget | null {
  const value = input.trim();
  if (!value) return null;
  if (/^\d+$/.test(value)) return { kind: "recording", id: Number(value) };
  const explicit = parseInspect(value);
  if (explicit) return explicit;
  if (UUID.test(value)) return { kind: "chunk", id: value.toLowerCase() };
  if (BILIBILI_BV.test(value)) return { kind: "source", platform: "bilibili", sourceId: value };
  const ref = parsePlatformUrl(value);
  if (ref?.kind === "recording") return { kind: "source", platform: ref.platform, sourceId: ref.id };
  return { kind: "search", q: value };
}

/** The console URL for a target. Inspector targets open over the current page. */
export function jumpHref(target: JumpTarget, current: { pathname: string; search: string }): string {
  switch (target.kind) {
    case "recording":
      return `/admin/recordings/${target.id}`;
    case "chunk":
    case "detection":
      return `${current.pathname}${withInspect(current.search, target)}`;
    case "source":
      return activityHref({ platform: target.platform, q: target.sourceId });
    case "search":
      return activityHref({ q: target.q });
  }
}
