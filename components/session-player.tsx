"use client";
import { useCallback, useEffect, useState } from "react";
import { cachedGet } from "@/lib/api-cache";
import { readUrlPlatformFilter, type PlatformFilter } from "@/lib/search-filters";
import { pickRecordingSource, preferredPlatform, sessionSources } from "@/lib/sources";
import { useEmbedActions } from "@/components/embed-provider";

/** The click that starts a Session and the URL change it causes both ask for it; the second is a no-op. */
let lastStart: { key: string; at: number } | null = null;
const DEDUPE_MS = 1500;

/** Start a Session in the persistent player: its Recording per the platform filter and the viewer's preference. */
export function useSessionPlayer() {
  const { setEmbed, setSources, reservePlayer } = useEmbedActions();
  return useCallback(async (sessionId: string, pin: string | null, filter: PlatformFilter, signal?: AbortSignal) => {
    const key = `${sessionId}|${pin}`;
    const started = () => lastStart?.key === key && Date.now() - lastStart.at < DEDUPE_MS;
    if (started()) return;
    reservePlayer(true);
    const session = await cachedGet(`/sessions/${sessionId}`, {}, { signal }).catch((error) => {
      reservePlayer(false);
      throw error;
    });
    if (signal?.aborted || started()) return reservePlayer(false);
    if (session.redirectedFrom !== undefined) window.history.replaceState(window.history.state, "", `/recordings/${session.id}${window.location.search}`);
    const sources = sessionSources(session);
    const pick = pickRecordingSource(sources, pin, preferredPlatform(), filter);
    if (!pick) {
      reservePlayer(false);
      throw new Error("This recording has no playable source");
    }
    lastStart = { key, at: Date.now() };
    setSources(sources, session.id);
    setEmbed(`v:${pick.recording.id}`, 0, {
      streamerId: pick.channel.streamerId === null ? null : String(pick.channel.streamerId),
      streamerName: pick.channel.displayName,
      streamerAvatar: pick.channel.avatarUrl ?? "",
      vodTitle: pick.recording.title,
      date: pick.recording.publishedAt ?? "",
    });
  }, [setEmbed, setSources, reservePlayer]);
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
