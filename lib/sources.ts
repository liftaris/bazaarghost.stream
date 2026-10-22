import type { Matchup, RecordingSource, Session, Source } from "./api-contract";
import { NO_PLATFORM_FILTER, platformAllowed, type PlatformFilter } from "./search-filters";
export { mapSessionTime } from "./session-navigation";

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

/**
 * Pinned Source, else the preferred platform, else the Streamer's own Recording, else any; null when
 * nothing plays. The platform filter narrows the choice, unless it would leave nothing to play.
 */
export function pickSource(matchup: Matchup, pin: string | null, preferred: string | null, filter: PlatformFilter = NO_PLATFORM_FILTER): RecordingSource | null {
  return pickRecordingSource(recordingSources(matchup.sources), pin, preferred, filter);
}

export function pickRecordingSource(playable: RecordingSource[], pin: string | null, preferred: string | null, filter: PlatformFilter = NO_PLATFORM_FILTER): RecordingSource | null {
  const pinned = playable.find((s) => pin !== null && sourcePin(s.recording.id) === pin);
  if (pinned) return pinned;
  const allowed = playable.filter((s) => platformAllowed(filter, s.platform));
  const pool = allowed.length > 0 ? allowed : playable;
  return (
    pool.find((s) => preferred !== null && s.platform === preferred) ??
    pool.find((s) => !s.isReupload) ??
    pool[0] ??
    null
  );
}

/** A Session's playable Recordings as Sources (at 0: the Session mapping moves the moment between them). */
export function sessionSources(session: Session): RecordingSource[] {
  return session.recordings.flatMap(({ recording }) =>
    recording.available
      ? [{
          kind: "recording" as const,
          platform: recording.platform,
          recording: { id: recording.id, sourceId: recording.sourceId, ...(recording.partId ? { partId: recording.partId } : {}), title: recording.title, publishedAt: recording.publishedAt, recordedAt: recording.recordedAt },
          at: 0,
          channel: recording.channel,
          isReupload: session.streamer === null ? false : recording.channel.streamerId !== session.streamer.id,
          available: true,
          watchUrl: "",
        }]
      : [],
  );
}

/** Canonical URL of a Recording: its Session, pinned to that Recording. */
export function recordingPath(sessionId: string | null, recordingId: number): string | null {
  return sessionId ? `/recordings/${sessionId}?source=${sourcePin(recordingId)}` : null;
}
