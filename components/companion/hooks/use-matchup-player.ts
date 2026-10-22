"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useEmbedActions, useEmbedState } from "@/components/embed-provider";
import type { Matchup, Session } from "@/lib/api-contract";
import { matchupTime } from "@/lib/session-navigation";
import { pickSource, preferredPlatform, sourcePin } from "@/lib/sources";
import { withListParams } from "@/lib/search-filters";

/** Select a canonical matchup and reopen/seek video, preferring its current aligned source. */
export function useMatchupPlayer(session: Session | null) {
  const { videoId } = useEmbedState();
  const { setEmbed, setSources, setActiveGhost, setMatchupContext } =
    useEmbedActions();
  const router = useRouter();
  return useCallback(
    (match: Matchup) => {
      const current = Number(videoId?.slice(2));
      const mapped = matchupTime(match, current, session);
      const source = pickSource(
        match,
        mapped !== null ? sourcePin(current) : null,
        preferredPlatform()
      );
      if (!source) return;
      const at = mapped ?? source.at;
      const id = mapped !== null ? current : source.recording.id;
      setSources(match.sources, match.session?.id ?? null);
      setEmbed(`v:${id}`, at);
      setActiveGhost({
        matchup_id: match.id,
        detection_id: String(match.id),
        username: match.opponent.username,
        nameState: match.opponent.nameState,
        rank: match.opponent.rank,
        frame_time_seconds: at,
      });
      setMatchupContext(match);
      // Always issue the newest intent: a different route may still be in flight even when
      // location.pathname already matches this target. Skipping would let the older route win.
      router.push(withListParams(`/matchups/${match.id}`), { scroll: false });
    },
    [
      videoId,
      session,
      setSources,
      setEmbed,
      setActiveGhost,
      setMatchupContext,
      router,
    ]
  );
}
