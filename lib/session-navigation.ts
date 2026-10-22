import type { Matchup, Session } from "./api-contract";

/** Map a moment between piecewise Recording timelines. Segment ends are exclusive. */
export function mapSessionTime(
  session: Session,
  fromId: number,
  toId: number,
  time: number
): number | null {
  const segments = (id: number) =>
    session.recordings.find((r) => r.recording.id === id)?.segments;
  const from = segments(fromId)?.find(
    (s) => time >= s.recStart && (s.recEnd === null || time < s.recEnd)
  );
  if (!from) return null;
  const at = time + from.offsetSeconds;
  const to = segments(toId)?.find(
    (s) =>
      at >= s.recStart + s.offsetSeconds &&
      (s.recEnd === null || at < s.recEnd + s.offsetSeconds)
  );
  return to ? at - to.offsetSeconds : null;
}

/** Resolve a Matchup anchor on a Recording, trying every available aligned copy. */
export function matchupTime(
  match: Matchup,
  recordingId: number,
  session: Session | null
): number | null {
  const sources = match.sources.filter(
    (s) => s.kind === "recording" && s.available
  );
  const own = sources.find(
    (s) => s.kind === "recording" && s.recording.id === recordingId
  );
  if (own?.kind === "recording") return own.at;
  if (session)
    for (const source of sources) {
      if (source.kind !== "recording") continue;
      const at = mapSessionTime(
        session,
        source.recording.id,
        recordingId,
        source.at
      );
      if (at !== null) return at;
    }
  return null;
}

/** Recognize an applied explicit/aligned source without overriding a valid explicit source pin. */
export function matchupOnRecording(match: Matchup, recordingId: number, pin: string | null, session: Session | null): boolean {
  const pinned = match.sources.find((s) => s.kind === "recording" && s.available && `r${s.recording.id}` === pin);
  if (pinned?.kind === "recording") return pinned.recording.id === recordingId;
  const aligned = session?.id === match.session?.id ? session : null;
  return matchupTime(match, recordingId, aligned) !== null;
}

/** One chronological display entry; day headers never imply a complete run. */
export type DayEntry =
  | { kind: "day"; key: string; day: number | null }
  | { kind: "matchup"; key: string; matchup: Matchup };

/** Group only adjacent supported days, preserving server order, unknowns and repeated IDs. */
export function observedDayEntries(matches: Matchup[]): DayEntry[] {
  const entries: DayEntry[] = [];
  const seen = new Set<number>();
  let previous: number | null | undefined;
  for (const match of matches) {
    if (seen.has(match.id)) continue;
    seen.add(match.id);
    const day = match.encounter.igd;
    if (day !== previous)
      entries.push({ kind: "day", key: `day:${match.id}`, day });
    entries.push({
      kind: "matchup",
      key: `matchup:${match.id}`,
      matchup: match,
    });
    previous = day;
  }
  return entries;
}

/** Step from the pinned selection, never from the passively advancing playhead. */
export function adjacentIndex(
  ids: number[],
  selected: number | null,
  direction: "prev" | "next"
): number {
  const index = selected === null ? -1 : ids.indexOf(selected);
  if (index < 0) return selected === null && direction === "next" && ids.length ? 0 : -1;
  const next = index + (direction === "next" ? 1 : -1);
  return next >= 0 && next < ids.length ? next : -1;
}

/** Accept only a finite persisted split ratio; corrupt or old values use the default. */
export function splitRatio(value: unknown, fallback: number): number {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1
    ? value
    : fallback;
}

/** Constrain a splitter consistently for pointer and keyboard; explicit extremes collapse panes. */
export function constrainSplit(
  ratio: number,
  size: number,
  before: number,
  after: number
): number {
  if (ratio <= 0) return 0;
  if (ratio >= 1) return 1;
  if (size <= before + after) return before / (before + after);
  return Math.min(1 - after / size, Math.max(before / size, ratio));
}

/** A compact source-relative clock, with no fabricated timestamp for an unknown anchor. */
export function clock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  return `${h ? `${h}:${String(m).padStart(2, "0")}` : m}:${String(whole % 60).padStart(2, "0")}`;
}
