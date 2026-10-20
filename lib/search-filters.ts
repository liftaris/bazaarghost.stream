import { isKnownPlatform } from "./platforms";

/** Platform filter: `include` narrows to those platforms, `exclude` drops them; both empty means any. */
export interface PlatformFilter {
  include: string[];
  exclude: string[];
}
export type PlatformState = "any" | "include" | "exclude";

export const NO_PLATFORM_FILTER: PlatformFilter = { include: [], exclude: [] };

/** Comma list of known platform ids, lower-cased and de-duplicated. */
export function parsePlatformList(raw: string | null): string[] {
  if (!raw) return [];
  return [...new Set(raw.split(",").map((id) => id.trim().toLowerCase()).filter((id) => id && isKnownPlatform(id)))];
}

export function platformState(filter: PlatformFilter, id: string): PlatformState {
  return filter.include.includes(id) ? "include" : filter.exclude.includes(id) ? "exclude" : "any";
}

/** any → include → exclude → any. */
export function cyclePlatform(filter: PlatformFilter, id: string): PlatformFilter {
  const rest = { include: filter.include.filter((p) => p !== id), exclude: filter.exclude.filter((p) => p !== id) };
  switch (platformState(filter, id)) {
    case "any": return { ...rest, include: [...rest.include, id] };
    case "include": return { ...rest, exclude: [...rest.exclude, id] };
    default: return rest;
  }
}

export function platformAllowed(filter: PlatformFilter, platform: string): boolean {
  return !filter.exclude.includes(platform) && (filter.include.length === 0 || filter.include.includes(platform));
}

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A valid `YYYY-MM-DD` day or null. */
export function parseDay(raw: string | null): string | null {
  const m = raw ? DAY.exec(raw) : null;
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return d.getFullYear() === +m[1] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[3] ? raw : null;
}

export function dayToDate(day: string): Date {
  const m = DAY.exec(day)!;
  return new Date(+m[1], +m[2] - 1, +m[3]);
}

export function dateToDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Local calendar day → ISO instants: From is local 00:00, To is local 23:59:59.999. */
export function fromInstant(day: string | null): string | null {
  return day ? dayToDate(day).toISOString() : null;
}
export function toInstant(day: string | null): string | null {
  if (!day) return null;
  const d = dayToDate(day);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

/** The API's platform/date list params for a filter set. */
export function filterParams(f: PlatformFilter & { from: string | null; to: string | null }) {
  return {
    platform: f.include.join(",") || null,
    excludePlatform: f.exclude.join(",") || null,
    from: fromInstant(f.from),
    to: toInstant(f.to),
  };
}

/** The platform filter in the live URL; read at action time so it never re-triggers an effect. */
export function readUrlPlatformFilter(): PlatformFilter {
  const params = new URLSearchParams(window.location.search);
  const include = parsePlatformList(params.get("platform"));
  return { include, exclude: parsePlatformList(params.get("xplatform")).filter((id) => !include.includes(id)) };
}

/** Params every list shares; a selection URL carries them so reload and back restore both panes. */
export const LIST_PARAMS = ["q", "platform", "xplatform", "from", "to", "streamer", "channel"] as const;

/** `path` plus the list params of the live URL. */
export function withListParams(path: string): string {
  const live = new URLSearchParams(window.location.search);
  const out = new URLSearchParams();
  for (const key of LIST_PARAMS) {
    const value = live.get(key);
    if (value) out.set(key, value);
  }
  return out.size ? `${path}?${out}` : path;
}
