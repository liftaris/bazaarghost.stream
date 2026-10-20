import { cache } from "react";
import { backendFetch } from "./backend-server";
import type { ChannelLookup, Matchup, MatchupDetail, Page, Playback, Recording, Session, Streamer, TimelineMarker } from "./api-contract";
import { recordingPath } from "./sources";

/** Share the current public matchup between metadata and rendering within one request. */
export const getMatchup = cache(
  async (id: number): Promise<MatchupDetail | null> => {
    if (!Number.isSafeInteger(id) || id < 1) return null;
    const fetchOnce = () => backendFetch(new Request(`https://bazaarghost.stream/api/v1/matchups/${id}`));
    let response = await fetchOnce();
    if (response.status === 429 || response.status >= 500) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      response = await fetchOnce();
    }
    if (response.status === 404) return null;
    if (!response.ok) throw new Error("Could not load matchup");
    return response.json();
  }
);

const BACKEND_TIMEOUT_MS = 5000;
const MAX_TIMELINE_PAGES = 20;

/** Bounded public GET; null on 404, throws on other failures or timeout. */
async function publicGet<T>(path: string, params: Record<string, string | number | null> = {}): Promise<T | null> {
  const url = new URL(`https://bazaarghost.stream/api/v1${path}`);
  for (const [k, v] of Object.entries(params)) if (v !== null) url.searchParams.set(k, String(v));
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Backend timeout")), BACKEND_TIMEOUT_MS);
  });
  try {
    const response = await Promise.race([backendFetch(new Request(url)), timeout]);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Backend error ${response.status}`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Resolve a Twitch login to where its Streamer page lives (or the Channel's search, when unowned), or null. */
export const resolveTwitchPath = cache(async (login: string): Promise<string | null> => {
  const found = await publicGet<ChannelLookup>("/channels/lookup", { platform: "twitch", login });
  if (!found) return null;
  return found.streamer ? `/streamers/${found.streamer.id}` : `/search?channel=${encodeURIComponent(found.channel.id)}`;
});

/** Share one Streamer lookup between metadata and rendering within a request. */
export const getStreamer = cache(async (id: number): Promise<Streamer | null> => {
  if (!Number.isSafeInteger(id) || id < 1) return null;
  return publicGet<Streamer>(`/streamers/${id}`);
});

/** Share one Session lookup between metadata and rendering within a request. */
export const getSession = cache(async (id: string): Promise<Session | null> => {
  if (!/^[0-9a-f]{32}$/.test(id)) return null;
  return publicGet<Session>(`/sessions/${id}`);
});

/** Where a Recording lives now: its Session, pinned to it; null when it has no Session. */
export async function recordingUrl(videoId: number): Promise<string | null> {
  const recording = await getVideo(videoId);
  return recording ? recordingPath(recording.sessionId, recording.id) : null;
}

/** Resolve a legacy Twitch VOD id (`v:<id>` or source id) to a recording id, or null. */
export async function resolveVideoId(vodId: string): Promise<number | null> {
  if (vodId.startsWith("v:")) {
    const id = Number(vodId.slice(2));
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  }
  const recording = await publicGet<Recording>("/recordings/lookup", { platform: "twitch", sourceId: vodId });
  return recording?.id ?? null;
}

/** Find the nth (1-based) timeline marker for a username in a video; paging is bounded. */
export async function findMatchupId(videoId: number, username: string, occurrence: number): Promise<number | null> {
  const wanted = username.toLowerCase();
  let cursor: string | null = null;
  let seen = 0;
  for (let page = 0; page < MAX_TIMELINE_PAGES; page++) {
    const result: Page<TimelineMarker> | null = await publicGet(`/recordings/${videoId}/timeline`, { cursor, limit: 100 });
    if (!result) return null;
    for (const marker of result.items) {
      if (marker.username.toLowerCase() === wanted && ++seen === occurrence) return marker.id;
    }
    cursor = result.nextCursor;
    if (!cursor) return null;
  }
  return null;
}

/** Playback metadata for a recording (title/channel), or null. */
export const getVideo = cache(async (id: number): Promise<Playback["recording"] | null> => {
  if (!Number.isSafeInteger(id) || id < 1) return null;
  return (await publicGet<Playback>(`/recordings/${id}/playback`))?.recording ?? null;
});

/** Most recent matchups for the sitemap. */
export async function getRecentMatchups(limit: number): Promise<Matchup[]> {
  const out: Matchup[] = [];
  let cursor: string | null = null;
  while (out.length < limit) {
    const page: Page<Matchup> | null = await publicGet("/search", { cursor, limit: Math.min(100, limit - out.length) });
    if (!page) break;
    out.push(...page.items);
    cursor = page.nextCursor;
    if (!cursor) break;
  }
  return out;
}
