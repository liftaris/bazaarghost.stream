import { unstable_cache } from "next/cache";
import { backendFetch } from "@/lib/backend-server";
import type { Page, PublicRoutes } from "@/lib/api-contract";
import { opponentLabel } from "@/lib/opponent-name";
import { recordingSources, sourcePin } from "@/lib/sources";
import { sampleGhosts } from "./sample-ghosts";
import type { LandingSnapshot } from "./types";

type SnapshotPath = "/stats" | "/streamers" | "/sessions" | "/search";
type Params = Record<string, string | number | null>;
const HOUR = 3_600_000;
const DAY = HOUR * 24;
const number = new Intl.NumberFormat("en-US");

class SnapshotRequestError extends Error {
  constructor(readonly status: number) {
    super(`Archive request failed: ${status}`);
  }
}

async function get<P extends SnapshotPath>(
  path: P,
  params: Params,
  signal: AbortSignal
): Promise<PublicRoutes[P]> {
  const url = new URL(`https://bazaarghost.stream/api/v1${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== null) url.searchParams.set(key, String(value));
  }
  const response = await backendFetch(new Request(url, { signal }));
  if (!response.ok) throw new SnapshotRequestError(response.status);
  return response.json();
}

async function collectPages<T>(
  load: (cursor: string | null) => Promise<Page<T>>,
  limit = Infinity
): Promise<T[]> {
  for (let attempt = 0; ; attempt++) {
    const items: T[] = [];
    const cursors = new Set<string>();
    let cursor: string | null = null;
    try {
      do {
        const page = await load(cursor);
        items.push(...page.items.slice(0, limit - items.length));
        cursor = page.nextCursor;
        if (cursor !== null) {
          if (cursors.has(cursor)) throw new Error("Archive cursor repeated");
          cursors.add(cursor);
        }
      } while (cursor !== null && items.length < limit);
      return items;
    } catch (error) {
      if (
        !(error instanceof SnapshotRequestError) ||
        error.status !== 409 ||
        attempt > 0
      )
        throw error;
    }
  }
}

async function loadSnapshot(): Promise<LandingSnapshot> {
  const now = Date.now();
  const generatedAt = new Date(now).toISOString();
  const recordingsFrom = new Date(now - DAY).toISOString();
  const ghostsFrom = new Date(now - DAY * 7).toISOString();
  const signal = AbortSignal.timeout(20_000);
  const [stats, streamers, sessions, pool] = await Promise.all([
    get("/stats", {}, signal),
    collectPages((cursor) => get("/streamers", { limit: 100, cursor }, signal)),
    collectPages((cursor) =>
      get(
        "/sessions",
        { from: recordingsFrom, to: generatedAt, limit: 100, cursor },
        signal
      )
    ),
    collectPages(
      (cursor) =>
        get(
          "/search",
          {
            representation: "summary",
            from: ghostsFrom,
            to: generatedAt,
            limit: 100,
            cursor,
          },
          signal
        ),
      500
    ),
  ]);

  return {
    generatedAt,
    recordingsFrom,
    stats,
    streamers: streamers.map((streamer) => ({
      href: `/streamers/${streamer.id}`,
      title: streamer.displayName,
      detail: `${number.format(streamer.sessionCount)} sessions · ${number.format(streamer.matchupCount)} matchups`,
      visual: { kind: "avatar", url: streamer.avatarUrl },
    })),
    recordings: sessions.map((session) => ({
      href: `/recordings/${session.id}?source=${sourcePin(session.defaultRecording.id)}`,
      title: session.title || "Untitled recording",
      detail: `${session.streamer?.displayName ?? session.channel.displayName} · ${number.format(session.matchupCount)} matchups`,
      visual: { kind: "recording" },
    })),
    ghosts: sampleGhosts(pool, Math.floor(now / HOUR)).map((matchup) => {
      const source = recordingSources(matchup.sources)[0];
      const day = matchup.encounter.igd ?? matchup.opponent.igd;
      return {
        href: `/matchups/${matchup.id}${source ? `?source=${sourcePin(source.recording.id)}` : ""}`,
        title: opponentLabel(matchup.opponent),
        detail: `${matchup.streamer?.displayName ?? "Unknown streamer"} · ${day === null ? "Day unknown" : `Day ${day}`}`,
        visual: { kind: "hero", hero: matchup.encounter.ghostHero },
      };
    }),
  };
}

/** Share public catalog data across requests; stale snapshots refresh in the background. */
export const getLandingSnapshot = unstable_cache(
  loadSnapshot,
  ["landing-snapshot-v1"],
  {
    revalidate: 3600,
    tags: ["landing-snapshot"],
  }
);
