"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEmbedActions, useEmbedState } from "@/components/embed-provider";
import { opponentLabel } from "@/lib/opponent-name";
import type { ReportTarget } from "@/lib/reports";
import { recentErrors } from "../lib/error-buffer";
import { resolveTarget } from "../lib/target";

/** A frozen picture of the app at the moment the report dialog opened. */
export interface ReportSnapshot {
  target: ReportTarget;
  context: Record<string, unknown>;
}

/**
 * Reads the URL, the player and the environment on demand, so the navbar never
 * re-renders on playback ticks.
 * @returns `capture`, which builds a {@link ReportSnapshot} of what the user is looking at right now.
 */
export function useReportSnapshot(): () => ReportSnapshot {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const embed = useEmbedState();
  const { getTime } = useEmbedActions();

  return useCallback(() => {
    const matchup = embed.selectedMatchup;
    const ghost = embed.selectedGhost ?? embed.activeGhost;
    const target = resolveTarget(pathname, {
      matchupId: matchup?.id ?? ghost?.matchup_id ?? null,
      opponent: matchup
        ? matchup.opponent.username
        : ghost
          ? opponentLabel(ghost)
          : null,
      sessionId: embed.contextSessionId ?? matchup?.session?.id ?? null,
      streamerId: embed.meta?.streamerId ?? null,
      streamerName: embed.meta?.streamerName ?? null,
    });
    const time = getTime();
    const recording = embed.playback?.recording;
    const context = {
      url: window.location.href,
      pathname,
      search: Object.fromEntries(new URLSearchParams(window.location.search)),
      player: {
        visible: embed.isVisible,
        ready: embed.isReady,
        error: embed.error,
        videoId: embed.videoId,
        platform: embed.playback?.player.platform ?? null,
        watchUrl: embed.playback?.player.watchUrl ?? null,
        recording: recording
          ? {
              id: recording.id,
              title: recording.title,
              sourceId: recording.sourceId,
              partId: recording.partId,
              durationSeconds: recording.durationSeconds,
              availability: recording.availability,
            }
          : null,
        processing: embed.playback?.processing.status ?? null,
        currentTime: Math.round(time.currentTime),
        duration: Math.round(time.duration),
        meta: embed.meta,
        sessionId: embed.contextSessionId,
        sources: embed.sources.map((s) => ({
          platform: s.platform,
          recordingId: s.recording.id,
          sourceId: s.recording.sourceId,
          at: s.at,
          channel: s.channel.displayName,
          isReupload: s.isReupload,
        })),
        ghostCount: embed.ghosts.length,
        activeGhost: embed.activeGhost,
        selectedGhost: embed.selectedGhost,
      },
      matchup: matchup
        ? {
            id: matchup.id,
            opponent: matchup.opponent,
            encounter: matchup.encounter,
            streamer: matchup.streamer,
            session: matchup.session,
            recordedAt: matchup.recordedAt,
            sourceCount: matchup.sources.length,
          }
        : null,
      environment: {
        viewport: `${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio}`,
        theme: resolvedTheme ?? null,
        language: navigator.language,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        online: navigator.onLine,
        touch: window.matchMedia("(pointer: coarse)").matches,
      },
      recentErrors: recentErrors(),
      capturedAt: new Date().toISOString(),
    };
    return { target, context };
  }, [pathname, resolvedTheme, embed, getTime]);
}
