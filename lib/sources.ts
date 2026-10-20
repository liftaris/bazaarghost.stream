import type { Matchup, RecordingSource, Session, Source } from "./api-contract";

const PREFERENCE_KEY = "bazaarghost:source-platform";

/** Playable (recording) Sources in API order. Clips are declared but not emitted or playable yet. */
export function recordingSources(sources: Source[]): RecordingSource[] {
  return sources.filter((s): s is RecordingSource => s.kind === "recording" && s.available);
}

/** `?source=r<recordingId>`: unique even when two Sources share a platform, and stable as Source order changes. */
export function sourcePin(recordingId: number): string {
  return `r${recordingId}`;
}

export function preferredPlatform(): string | null {
  try {
    return localStorage.getItem(PREFERENCE_KEY);
  } catch {
    return null;
  }
}

export function rememberPlatform(platform: string) {
  try {
    localStorage.setItem(PREFERENCE_KEY, platform);
  } catch {
    // Private mode or storage disabled: the preference simply does not persist
  }
}

/** Pinned Source, else the preferred platform, else the Streamer's own Recording, else any; null when nothing plays. */
export function pickSource(matchup: Matchup, pin: string | null, preferred: string | null): RecordingSource | null {
  const playable = recordingSources(matchup.sources);
  return (
    playable.find((s) => pin !== null && sourcePin(s.recording.id) === pin) ??
    playable.find((s) => preferred !== null && s.platform === preferred) ??
    playable.find((s) => !s.isReupload) ??
    playable[0] ??
    null
  );
}

/** Where the same moment sits in another Recording of the Session, or null when it is not covered. */
export function mapSessionTime(session: Session, fromId: number, toId: number, time: number): number | null {
  const find = (id: number) => session.recordings.find((r) => r.recording.id === id)?.segments;
  const from = find(fromId)?.find((s) => time >= s.recStart && (s.recEnd === null || time < s.recEnd));
  if (!from) return null;
  const sessionTime = time + from.offsetSeconds;
  const to = find(toId)?.find(
    (s) => sessionTime >= s.recStart + s.offsetSeconds && (s.recEnd === null || sessionTime < s.recEnd + s.offsetSeconds),
  );
  return to ? sessionTime - to.offsetSeconds : null;
}
