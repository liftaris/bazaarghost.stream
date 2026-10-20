import type { StreamerOption as Option } from "@/lib/result-models";

/**
 * The active search tab / content mode.
 *
 * - `"ghosts"` — fuzzy-search ghost detections (default mode)
 * - `"vods"` — search available VODs by title or source ID
 * - `"streamers"` — client-side filter over tracked streamers
 * - `"saved"` — the signed-in user's bookmarked matchups
 */
export type SearchMode = "ghosts" | "vods" | "streamers" | "saved";

/**
 * Structured values extracted from the current URL pathname.
 *
 * Used to derive implicit filters (e.g. a streamer filter is implied when the
 * user is on `/nl_kripp`).
 */
export interface RouteContext {
  /** The streamer from the path (e.g. `/nl_kripp` -> `"nl_kripp"`). */
  pathStreamer: string | null;
  /** The VOD source ID from the path (e.g. `/nl_kripp/2345678`). */
  pathVodId: string | null;
  /** The ghost username from the path (e.g. `/nl_kripp/2345678/Ender` or `/ghost/Ender`). */
  pathUsername: string | null;
}

/** A Streamer with public Matchups; the option type of the picker and the streamers result list. */
export type StreamerOption =
  Option;

/**
 * A display-ready representation of the currently-selected streamer filter.
 *
 * Resolved from a {@link StreamerOption} row by matching the URL's effective
 * streamer value against display names or IDs.
 */
export interface ResolvedStreamer {
  /** The streamer's numeric ID (nullable because the view column is nullable). */
  id: string | null;
  /** The streamer's display name (e.g. `"nl_Kripp"`). */
  displayName: string;
  /** URL to the streamer's avatar image. */
  avatar: string;
}
