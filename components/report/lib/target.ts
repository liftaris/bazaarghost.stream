import type { ReportTarget } from "@/lib/reports";

/** What the player is showing, as far as report targeting cares. */
export interface PlayerFocus {
  matchupId: number | null;
  opponent: string | null;
  sessionId: string | null;
  streamerId: string | null;
  streamerName: string | null;
}

const RESERVED = new Set([
  "search",
  "saved",
  "streamers",
  "recordings",
  "vods",
  "videos",
  "ghost",
  "matchups",
  "how-it-works",
  "contact",
  "donate",
  "account",
  "admin",
  "detections",
]);

/** Resolve the most specific thing on screen: the URL's resource first, then whatever the player holds. */
export function resolveTarget(
  pathname: string,
  player: PlayerFocus
): ReportTarget {
  const [first, second] = pathname
    .split("/")
    .filter(Boolean)
    .map(decodeURIComponent);
  if (first === "matchups" && second)
    return {
      kind: "matchup",
      id: second,
      label: player.matchupId === Number(second) ? player.opponent : null,
    };
  if (first === "recordings" && second)
    return { kind: "session", id: second, label: player.streamerName };
  if (first === "streamers" && second)
    return { kind: "streamer", id: second, label: null };
  if (player.matchupId != null)
    return {
      kind: "matchup",
      id: String(player.matchupId),
      label: player.opponent,
    };
  if (player.sessionId)
    return {
      kind: "session",
      id: player.sessionId,
      label: player.streamerName,
    };
  if (first && !RESERVED.has(first))
    return { kind: "streamer", id: first, label: first };
  if (player.streamerId)
    return {
      kind: "streamer",
      id: player.streamerId,
      label: player.streamerName,
    };
  return { kind: "page", id: pathname, label: null };
}
