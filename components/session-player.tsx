"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cachedGet } from "@/lib/api-cache";
import { readUrlPlatformFilter, type PlatformFilter } from "@/lib/search-filters";
import { pickRecordingSource, pickSource, preferredPlatform, sessionSources } from "@/lib/sources";
import { useEmbedActions, useEmbedState } from "@/components/embed-provider";
import { matchupTime } from "@/lib/session-navigation";

/** An applied/current Session intent; callers must not navigate when a start returns null. */
export interface SessionStart {
  sessionId: string;
  isCurrent: () => boolean;
}

/** Start a Session in the persistent player: its Recording per the platform filter and the viewer's preference. */
export function useSessionPlayer() {
  const { setEmbed, setSources, reservePlayer, switchSource, beginPlaybackIntent, getPlaybackIntent } = useEmbedActions();
  const { setActiveGhost, setMatchupContext } = useEmbedActions();
  const state = useEmbedState();
  const live = useRef(state);
  useLayoutEffect(() => { live.current = state; });
  return useCallback(async (sessionId: string, pin: string | null, filter: PlatformFilter, signal?: AbortSignal): Promise<SessionStart | null> => {
    if (signal?.aborted) return null;
    const intent = beginPlaybackIntent();
    const current = () => !signal?.aborted && getPlaybackIntent() === intent;
    const completed = (id: string): SessionStart => {
      const applied = getPlaybackIntent();
      return { sessionId: id, isCurrent: () => !signal?.aborted && getPlaybackIntent() === applied };
    };
    const initialContext = live.current.contextSessionId;
    const initialSelected = live.current.selectedGhost;
    const initialVideo = live.current.videoId;
    if (initialContext === sessionId && initialVideo && (!pin || pin === `r${initialVideo.slice(2)}`)) {
      reservePlayer(false);
      return completed(sessionId);
    }
    reservePlayer(true);
    const loaded = await Promise.all([
      cachedGet(`/sessions/${sessionId}`, {}, { signal }),
      cachedGet("/search", { sessionId, sort: "time", limit: 500 }, { signal }).catch(() => null),
    ]).catch((error) => {
      if (!current()) return null;
      reservePlayer(false);
      throw error;
    });
    if (!current() || !loaded) {
      if (getPlaybackIntent() === intent) reservePlayer(false);
      return null;
    }
    if (live.current.videoId !== initialVideo || live.current.selectedGhost !== initialSelected) {
      reservePlayer(false);
      return null;
    }
    const [session, page] = loaded;
    if (session.redirectedFrom !== undefined) window.history.replaceState(window.history.state, "", `/recordings/${session.id}${window.location.search}`);
    const sources = sessionSources(session);
    const pick = pickRecordingSource(sources, pin, preferredPlatform(), filter);
    if (!pick) {
      reservePlayer(false);
      throw new Error("This recording has no playable source");
    }
    if (initialContext === session.id && initialVideo) {
      reservePlayer(false);
      switchSource(pick);
      return completed(session.id);
    }
    const first = page?.items.find((m) => pickSource(m, pin, preferredPlatform(), filter) !== null);
    const firstSource = first ? pickSource(first, pin, preferredPlatform(), filter)! : pick;
    const mapped = first ? matchupTime(first, pick.recording.id, session) : null;
    const destination = first && mapped === null ? firstSource : pick;
    const at = first ? mapped ?? firstSource.at : 0;
    setSources(first?.sources ?? sources, session.id);
    setActiveGhost(null);
    setEmbed(`v:${destination.recording.id}`, at, {
      streamerId: destination.channel.streamerId === null ? null : String(destination.channel.streamerId),
      streamerName: destination.channel.displayName,
      streamerAvatar: destination.channel.avatarUrl ?? "",
      vodTitle: destination.recording.title,
      date: destination.recording.publishedAt ?? "",
    });
    if (!first) return completed(session.id);
    // Direct Session entry chooses one anchor, never zero first or again on page append.
    setActiveGhost({ matchup_id: first.id, detection_id: String(first.id), username: first.opponent.username, nameState: first.opponent.nameState, rank: first.opponent.rank, frame_time_seconds: at });
    setMatchupContext(first);
    return completed(session.id);
  }, [setEmbed, setSources, reservePlayer, setActiveGhost, setMatchupContext, switchSource, beginPlaybackIntent, getPlaybackIntent]);
}

/** Bootstrap the player from a `/recordings/:id` (or `?recording=`) URL. */
export function SessionLoader({ sessionId, source = null }: { sessionId: string; source?: string | null }) {
  const start = useSessionPlayer();
  const key = `${sessionId}|${source}`;
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    start(sessionId, source, readUrlPlatformFilter(), controller.signal).catch((error) => {
      if (!controller.signal.aborted) setFailure({ key, message: error instanceof Error ? error.message : "Could not open recording" });
    });
    return () => controller.abort();
  }, [sessionId, source, key, start]);
  return failure?.key === key ? <p role="alert" className="p-3 text-sm">{failure.message}</p> : null;
}
