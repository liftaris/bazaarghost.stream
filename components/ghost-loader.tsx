"use client";
import { useEffect, useEffectEvent, useState } from "react";
import type { Matchup } from "@/lib/api-contract";
import { cachedGet } from "@/lib/api-cache";
import { useEmbedActions, useEmbedState } from "@/components/embed-provider";

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
  const { setEmbed, setActiveGhost } = useEmbedActions();
  const { activeGhost, videoId } = useEmbedState();
  // Read live player state inside the bootstrap effect without re-running it
  const readLive = useEffectEvent(() => ({ activeGhost, videoId, initialMatchup }));
  const requestKey = `${vodId}|${timestamp}|${matchupId}`;
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const error = failure?.key === requestKey ? failure.message : null;
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        if (matchupId !== undefined) {
          const live = readLive();
          const initial = live.initialMatchup?.id === matchupId ? live.initialMatchup : undefined;
          // Already showing this matchup (user click or passive advance): don't re-seek
          const { activeGhost: ghost, videoId: loaded } = live;
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
        if (controller.signal.aborted || readLive().videoId === vodId) return;
        setEmbed(vodId, timestamp);
      } catch (error) {
        if (!controller.signal.aborted)
          setFailure({
            key: requestKey,
            message: error instanceof Error ? error.message : "Could not open matchup",
          });
      }
    };
    void load();
    return () => controller.abort();
  }, [
    vodId,
    timestamp,
    matchupId,
    requestKey,
    setEmbed,
    setActiveGhost,
  ]);
  return error ? (
    <p role="alert" className="p-3 text-sm">
      {error}
    </p>
  ) : null;
}
