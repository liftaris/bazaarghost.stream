"use client";
import { useEffect, useState } from "react";
import { ApiError, apiGet } from "@/lib/api-client";
import type { Playback, TimelineMarker } from "@/lib/api-contract";

/** Load playback and every timeline page with cancellation and one correction refresh. */
export function usePlayback(videoKey: string | null) {
  const [data, setData] = useState<Playback | null>(null);
  const [markers, setMarkers] = useState<TimelineMarker[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController(); setData(null); setMarkers([]); setError(null);
    if (!videoKey) return;
    const load = async () => {
      try {
        const id = videoKey.startsWith("v:") ? Number(videoKey.slice(2))
          : (await apiGet("/videos/resolve", { source: "twitch", sourceId: videoKey }, controller.signal)).id;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const playback = await apiGet(`/videos/${id}/playback`, {}, controller.signal);
            if (controller.signal.aborted) return;
            setData(playback); setMarkers(playback.timeline.items);
            let cursor = playback.timeline.nextCursor;
            while (cursor) {
              const page = await apiGet(`/videos/${id}/timeline`, { cursor, limit: 100 }, controller.signal);
              if (controller.signal.aborted) return;
              setMarkers(previous => [...previous, ...page.items]); cursor = page.nextCursor;
            }
            return;
          } catch (error) {
            if (!(error instanceof ApiError) || error.status !== 409 || attempt === 1) throw error;
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Could not load video");
      }
    };
    void load(); return () => controller.abort();
  }, [videoKey]);
  return { data, markers, error };
}
