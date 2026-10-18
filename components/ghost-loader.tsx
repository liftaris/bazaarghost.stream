"use client";
import { useEffect, useRef, useState } from "react";
import type { Matchup } from "@/lib/api-contract";
import { cachedGet } from "@/lib/api-cache";
import { useEmbed } from "@/components/embed-provider";

/** Bootstrap the player from a durable URL. Legacy URLs are redirected on the server. */
export function GhostLoader({
  vodId,
  timestamp = 0,
  matchupId,
  initialMatchup,
}: {
  /** Internal video ID as `v:<id>`. */
  vodId?: string;
  timestamp?: number;
  matchupId?: number;
  initialMatchup?: Matchup;
}) {
  const { setEmbed, setActiveGhost, activeGhost, videoId } = useEmbed();
  // Read live player state inside the bootstrap effect without re-running it
  const live = useRef({ activeGhost, videoId });
  live.current = { activeGhost, videoId };
  const initialMatchupRef = useRef(initialMatchup);
  initialMatchupRef.current = initialMatchup;
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    const load = async () => {
      try {
        if (matchupId !== undefined) {
          const initial = initialMatchupRef.current?.id === matchupId ? initialMatchupRef.current : undefined;
          // Already showing this matchup (user click or passive advance): don't re-seek
          const { activeGhost: ghost, videoId: loaded } = live.current;
          if (
            ghost?.matchup_id === matchupId &&
            (!initial || loaded === `v:${initial.video.id}`)
          )
            return;
          const { matchup } = initial
            ? { matchup: initial }
            : await cachedGet(`/matchups/${matchupId}`, {}, { signal: controller.signal });
          if (controller.signal.aborted) return;
          setEmbed(`v:${matchup.video.id}`, matchup.timestampSeconds, {
            streamerName: matchup.video.creator.name,
            streamerAvatar: matchup.video.creator.avatarUrl ?? "",
            vodTitle: matchup.video.title,
            date: matchup.video.publishedAt ?? "",
          });
          setActiveGhost({
            matchup_id: matchup.id,
            detection_id: matchup.detection.id,
            username: matchup.detection.username,
            rank: matchup.detection.rank,
            frame_time_seconds: matchup.timestampSeconds,
          });
          return;
        }
        if (!vodId) return;
        if (controller.signal.aborted || live.current.videoId === vodId) return;
        setEmbed(vodId, timestamp);
      } catch (error) {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error ? error.message : "Could not open matchup"
          );
      }
    };
    void load();
    return () => controller.abort();
  }, [
    vodId,
    timestamp,
    matchupId,
    setEmbed,
    setActiveGhost,
  ]);
  return error ? (
    <p role="alert" className="p-3 text-sm">
      {error}
    </p>
  ) : null;
}
