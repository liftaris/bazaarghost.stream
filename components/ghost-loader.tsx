"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Matchup, Playback } from "@/lib/api-contract";
import { apiGet } from "@/lib/api-client";
import { useEmbed } from "@/components/embed-provider";

/** Resolve durable links and preserve legacy Twitch/name/occurrence URLs. */
export function GhostLoader({
  vodId,
  timestamp = 0,
  username,
  occurrence = 1,
  matchupId,
  initialMatchup,
}: {
  vodId?: string;
  timestamp?: number;
  username?: string;
  occurrence?: number;
  matchupId?: number;
  initialMatchup?: Matchup;
}) {
  const { setEmbed, setActiveGhost } = useEmbed();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    const load = async () => {
      try {
        if (matchupId !== undefined) {
          const { matchup } = initialMatchup
            ? { matchup: initialMatchup }
            : await apiGet(`/matchups/${matchupId}`, {}, controller.signal);
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
        const id = vodId.startsWith("v:")
          ? Number(vodId.slice(2))
          : (
              await apiGet(
                "/videos/resolve",
                { source: "twitch", sourceId: vodId },
                controller.signal
              )
            ).id;
        if (username) {
          let cursor: string | null = null,
            seen = 0;
          do {
            const page: Playback["timeline"] = await apiGet(
              `/videos/${id}/timeline`,
              { cursor, limit: 100 },
              controller.signal
            );
            for (const marker of page.items) {
              if (
                marker.username.toLowerCase() === username.toLowerCase() &&
                ++seen === occurrence
              ) {
                if (!controller.signal.aborted)
                  router.replace(`/matchups/${marker.id}`, { scroll: false });
                return;
              }
            }
            cursor = page.nextCursor;
          } while (cursor);
          throw new Error(
            "This matchup is no longer available under its old name."
          );
        }
        if (controller.signal.aborted) return;
        setEmbed(`v:${id}`, timestamp);
        if (!vodId.startsWith("v:"))
          router.replace(`/videos/${id}`, { scroll: false });
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
    username,
    occurrence,
    matchupId,
    initialMatchup,
    setEmbed,
    setActiveGhost,
    router,
  ]);
  return error ? (
    <p role="alert" className="p-3 text-sm">
      {error}
    </p>
  ) : null;
}
