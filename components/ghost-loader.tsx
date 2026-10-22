"use client";
import { useEffect, useEffectEvent, useState } from "react";
import type { MatchupDetail } from "@/lib/api-contract";
import { cachedGet } from "@/lib/api-cache";
import { ghostResult } from "@/lib/result-models";
import { readUrlPlatformFilter } from "@/lib/search-filters";
import { pickSource, preferredPlatform } from "@/lib/sources";
import { matchupOnRecording } from "@/lib/session-navigation";
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
  const { setEmbed, setActiveGhost, setSources, setMatchupContext, hideEmbed, getPlaybackIntent } = useEmbedActions();
  const { selectedGhost, videoId, isVisible, contextSessionId } = useEmbedState();
  // Read live player state inside the bootstrap effect without re-running it
  const readLive = useEffectEvent(() => ({ selectedGhost, videoId, initialMatchup, isVisible, contextSessionId }));
  const requestKey = String(matchupId);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const error = failure?.key === requestKey ? failure.message : null;
  useEffect(() => {
    const controller = new AbortController();
    const intent = getPlaybackIntent();
    const current = () => !controller.signal.aborted && getPlaybackIntent() === intent && window.location.pathname === `/matchups/${matchupId}`;
    const load = async () => {
      try {
        if (window.location.pathname !== `/matchups/${matchupId}`) return;
        const live = readLive();
        const initial = live.initialMatchup?.id === matchupId ? live.initialMatchup : undefined;
        // Hydration must respect an already committed selection, including an aligned-only copy.
        const { selectedGhost: ghost, videoId: loaded } = live;
        const selected = ghost?.matchup_id === matchupId && live.isVisible;
        if (selected && !initial && !source) return;
        const matchup = initial ?? (await cachedGet(`/matchups/${matchupId}`, {}, { signal: controller.signal }));
        if (!current()) return;
        if (selected && loaded) {
          const recordingId = Number(loaded.slice(2));
          let showing = matchupOnRecording(matchup, recordingId, source, null);
          if (!showing && matchup.session?.id && live.contextSessionId === matchup.session.id) {
            const session = await cachedGet(`/sessions/${matchup.session.id}`, {}, { signal: controller.signal }).catch(() => null);
            if (!current()) return;
            showing = matchupOnRecording(matchup, recordingId, source, session);
          }
          if (showing) { setMatchupContext(matchup); return; }
        }
        if (matchup.redirectedFrom !== undefined) window.history.replaceState(window.history.state, "", `/matchups/${matchup.id}${window.location.search}`);
        const result = ghostResult(matchup, pickSource(matchup, source, preferredPlatform(), readUrlPlatformFilter()));
        if (!result) {
          hideEmbed();
          setSources(matchup.sources, matchup.session?.id ?? null);
          setActiveGhost(null);
          setMatchupContext(matchup);
          setFailure({ key: requestKey, message: "This matchup has no playable source" });
          return;
        }
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
          nameState: result.nameState,
          rank: result.rank,
          frame_time_seconds: result.frame_time_seconds,
        });
        setMatchupContext(matchup);
      } catch (error) {
        if (current())
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
    setMatchupContext,
    hideEmbed,
    getPlaybackIntent,
  ]);
  return error ? (
    <p role="alert" className="p-3 text-sm">
      {error}
    </p>
  ) : null;
}
