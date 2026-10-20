import type { SearchMode, Selection } from "../types";

/**
 * Reserved top-level names that must NOT be matched by the dynamic `[streamer]`
 * catch-all. Used by the `[streamer]` page.
 */
export const RESERVED_TOP_LEVEL = [
  "search",
  "streamers",
  "recordings",
  "vods",
  "saved",
  "ghost",
  "login",
  "account",
  "contact",
  "donate",
  "how-it-works",
  "api",
  "matchups",
  "videos",
];

/** Search mode paths, in chip order. */
export const MODE_PATHS: Record<Exclude<SearchMode, "saved">, string> = {
  ghosts: "/search",
  streamers: "/streamers",
  recordings: "/recordings",
};

/**
 * The mode a pathname belongs to: `/streamers[/:id]`, `/recordings[/:id]`, `/saved`;
 * everything else (`/search`, `/matchups/:id`, `/`) is Ghosts.
 */
export function deriveSearchMode(pathname: string): SearchMode {
  if (/^\/streamers(\/|$)/.test(pathname)) return "streamers";
  if (/^\/recordings(\/|$)/.test(pathname)) return "recordings";
  if (/^\/saved(\/|$)/.test(pathname)) return "saved";
  return "ghosts";
}

/** The Matchup, Streamer or Session a pathname selects, if any. */
export function deriveSelection(pathname: string): Selection | null {
  const match = /^\/(matchups|streamers|recordings)\/([^/]+)\/?$/.exec(pathname);
  if (!match) return null;
  const kind = match[1] === "matchups" ? "matchup" : match[1] === "streamers" ? "streamer" : "recording";
  return { kind, id: decodeURIComponent(match[2]) };
}
