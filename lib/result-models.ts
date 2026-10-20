import type { Creator, Matchup, Video } from "./api-contract";

/** Presentation fields used by the existing result rows, derived from native API cards. */
export interface GhostResult {
  matchup_id: number; detection_id: string; username: string; rank: string | null;
  frame_time_seconds: number; actual_timestamp: string; confidence: number; similarity_score: number;
  vod_id: number; vod_source_id: string; vod_platform: string; streamer_id: string; streamer_display_name: string;
  streamer_avatar: string; vod_title: string;
}
/** Complete video card; the browser never joins it to a separate creator list. */
export interface VodResult {
  vod_id: number; vod_source_id: string; title: string; published_at: string; duration_seconds: number;
  streamer_id: string; streamer_display_name: string; streamer_avatar: string; streamer_login: string; ghost_count: number;
}
/** Creator picker option with a platform-qualified ID. */
export interface StreamerOption {
  streamer_id: string; streamer_display_name: string; streamer_avatar: string; streamer_login: string;
  platform: Creator["platform"];
}
/** Adapt a native matchup without changing its stable identity. */
export function ghostResult(value: Matchup): GhostResult {
  return { matchup_id: value.id, detection_id: value.detection.id, username: value.detection.username,
    rank: value.detection.rank, frame_time_seconds: value.timestampSeconds,
    actual_timestamp: value.recordedAt ?? value.indexedAt, confidence: value.detection.confidence,
    similarity_score: value.relevance.score, vod_id: value.video.id, vod_source_id: `v:${value.video.id}`, vod_platform: value.video.platform,
    streamer_id: value.video.creator.id, streamer_display_name: value.video.creator.name,
    streamer_avatar: value.video.creator.avatarUrl ?? "", vod_title: value.video.title };
}
/** Adapt a native video for the existing result layout. */
export function vodResult(value: Video): VodResult {
  return { vod_id: value.id, vod_source_id: `v:${value.id}`, title: value.title,
    published_at: value.publishedAt ?? "", duration_seconds: value.durationSeconds,
    streamer_id: value.creator.id, streamer_display_name: value.creator.name,
    streamer_avatar: value.creator.avatarUrl ?? "", streamer_login: value.creator.login ?? "", ghost_count: value.matchupCount ?? 0 };
}
/** Adapt a platform account to a picker option. */
export function streamerOption(value: Creator): StreamerOption {
  return { streamer_id: value.id, streamer_display_name: value.name, streamer_avatar: value.avatarUrl ?? "",
    streamer_login: value.login ?? "", platform: value.platform };
}
