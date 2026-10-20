import type { StreamerOption as Option } from "@/lib/result-models";

/**
 * The active search mode.
 *
 * - `"ghosts"` — search Matchups (default mode)
 * - `"streamers"` — browse Streamers
 * - `"recordings"` — browse Sessions (one stream, possibly several platform copies)
 * - `"saved"` — the signed-in user's bookmarked matchups
 */
export type SearchMode = "ghosts" | "streamers" | "recordings" | "saved";

/** What the path selects: a Matchup, a Streamer or a Session. */
export interface Selection {
  kind: "matchup" | "streamer" | "recording";
  id: string;
}

/** A Streamer with public Matchups; the option type of the picker. */
export type StreamerOption =
  Option;

/** A display-ready representation of the currently-selected streamer filter. */
export interface ResolvedStreamer {
  /** The streamer's numeric ID (nullable because the view column is nullable). */
  id: string | null;
  /** The streamer's display name (e.g. `"nl_Kripp"`). */
  displayName: string;
  /** URL to the streamer's avatar image. */
  avatar: string;
}
