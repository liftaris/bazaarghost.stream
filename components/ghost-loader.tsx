"use client";
import { useEffect, useEffectEvent, useState } from "react";
import type { MatchupDetail } from "@/lib/api-contract";
import { cachedGet } from "@/lib/api-cache";
import { ghostResult } from "@/lib/result-models";
import { readUrlPlatformFilter } from "@/lib/search-filters";
import { pickSource, preferredPlatform, recordingSources } from "@/lib/sources";
import { useEmbedActions, useEmbedState } from "@/components/embed-provider";

/** Bootstrap the player from `/matchups/:id`. Legacy URLs are redirected on the server. */
export function GhostLoader({
  matchupId,
  initialMatchup,
  source = null,
}: {
  matchupId: number;
  initialMatchup?: MatchupDetail;
  /** `?source=` pin; falls back to the default Source when it is not playable. */
  source?: string | null;
}) {
  const { setEmbed, setActiveGhost, setSources } = useEmbedActions();
  const { activeGhost, videoId } = useEmbedState();
  // Read live player state inside the bootstrap effect without re-running it
  const readLive = useEffectEvent(() => ({ activeGhost, videoId, initialMatchup }));
  const requestKey = String(matchupId);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const error = failure?.key === requestKey ? failure.message : null;
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const live = readLive();
        const initial = live.initialMatchup?.id === matchupId ? live.initialMatchup : undefined;
        // Already showing this matchup (user click or passive advance): don't re-seek
        const { activeGhost: ghost, videoId: loaded } = live;
        const showing = !initial || recordingSources(initial.sources).some((s) => `v:${s.recording.id}` === loaded);
        if (ghost?.matchup_id === matchupId && showing) return;
        const matchup = initial ?? (await cachedGet(`/matchups/${matchupId}`, {}, { signal: controller.signal }));
        if (controller.signal.aborted) return;
        if (matchup.redirectedFrom !== undefined) window.history.replaceState(window.history.state, "", `/matchups/${matchup.id}${window.location.search}`);
        const result = ghostResult(matchup, pickSource(matchup, source, preferredPlatform(), readUrlPlatformFilter()));
        if (!result) throw new Error("This matchup has no playable source");
        setSources(matchup.sources, matchup.session?.id ?? null);
        setEmbed(result.vod_source_id, result.frame_time_seconds, {
          streamerId: result.streamer_id,
          streamerName: result.streamer_display_name,
          streamerAvatar: result.streamer_avatar,
          vodTitle: result.vod_title,
          date: matchup.recordedAt ?? "",
        });
        setActiveGhost({
          matchup_id: result.matchup_id,
          detection_id: String(result.matchup_id),
          username: result.username,
          rank: result.rank,
          frame_time_seconds: result.frame_time_seconds,
        });
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
    matchupId,
    source,
    requestKey,
    setEmbed,
    setSources,
    setActiveGhost,
  ]);
  return error ? (
    <p role="alert" className="p-3 text-sm">
      {error}
    </p>
  ) : null;
}
