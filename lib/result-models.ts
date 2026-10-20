import type { Matchup, RecordingSource, Streamer } from "./api-contract";
import type { SourceStackItem } from "@/components/source-stack";

/** Presentation fields of one Matchup row; playback uses its default Source. */
export interface GhostResult {
  matchup_id: number; username: string; rank: string | null;
  frame_time_seconds: number; actual_timestamp: string;
  vod_id: number; vod_source_id: string; vod_title: string;
  /** Null when the Channel has no Streamer; the row then names the Channel. */
  streamer_id: string | null; streamer_display_name: string; streamer_avatar: string;
  sources: SourceStackItem[];
}
/** Streamer picker option. */
export interface StreamerOption {
  streamer_id: string; streamer_display_name: string; streamer_avatar: string; platforms: string[];
}

/** First available recording Source in the API's order, or null. */
function defaultSource(value: Matchup): RecordingSource | null {
  return value.sources.find((s): s is RecordingSource => s.kind === "recording" && s.available) ?? null;
}
/** One mark per platform, in Source order; a clip-only platform keeps its clip badge. */
function sourceMarks(value: Matchup): SourceStackItem[] {
  const marks = new Map<string, SourceStackItem>();
  for (const s of value.sources) {
    if (!s.available) continue;
    const held = marks.get(s.platform);
    if (!held || (held.kind === "clip" && s.kind === "recording")) {
      const channel = s.kind === "recording" ? s.channel : s.attribution;
      marks.set(s.platform, { platform: s.platform, kind: s.kind, channel: channel.displayName, reupload: s.kind === "recording" && s.isReupload });
    }
  }
  return [...marks.values()];
}
/** Who to show for a Matchup: its Streamer, else the Channel of its first Source. */
export function matchupOwner(value: Matchup): { id: string | null; name: string; avatar: string } {
  if (value.streamer) return { id: String(value.streamer.id), name: value.streamer.displayName, avatar: value.streamer.avatarUrl ?? "" };
  const first = value.sources[0];
  const channel = first && (first.kind === "recording" ? first.channel : first.attribution);
  return { id: null, name: channel?.displayName ?? "Unknown channel", avatar: channel?.avatarUrl ?? "" };
}
/** Adapt a Matchup for the result layout; null when it has no playable recording. */
export function ghostResult(value: Matchup, chosen?: RecordingSource | null): GhostResult | null {
  const source = chosen ?? defaultSource(value);
  if (!source) return null;
  const owner = matchupOwner(value);
  return { matchup_id: value.id, username: value.opponent.username, rank: value.opponent.rank,
    frame_time_seconds: source.at, actual_timestamp: value.recordedAt ?? value.indexedAt,
    vod_id: source.recording.id, vod_source_id: `v:${source.recording.id}`, vod_title: source.recording.title,
    streamer_id: owner.id, streamer_display_name: owner.name, streamer_avatar: owner.avatar,
    sources: sourceMarks(value) };
}
/** Adapt a Streamer to a picker option. */
export function streamerOption(value: Streamer): StreamerOption {
  return { streamer_id: String(value.id), streamer_display_name: value.displayName, streamer_avatar: value.avatarUrl ?? "",
    platforms: [...new Set(value.channels.map((c) => c.platform))] };
}
