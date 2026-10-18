"use client";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { cachedGet, invalidate } from "@/lib/api-cache";
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
          : (await cachedGet("/videos/resolve", { source: "twitch", sourceId: videoKey }, { signal: controller.signal })).id;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const playback = await cachedGet(`/videos/${id}/playback`, {}, { signal: controller.signal });
            if (controller.signal.aborted) return;
            const all = [...playback.timeline.items];
            let cursor = playback.timeline.nextCursor;
            while (cursor) {
              const page = await cachedGet(`/videos/${id}/timeline`, { cursor, limit: 100 }, { signal: controller.signal });
              all.push(...page.items); cursor = page.nextCursor;
            }
            if (controller.signal.aborted) return;
            setData(playback); setMarkers(all);
            return;
          } catch (error) {
            if (!(error instanceof ApiError) || error.status !== 409 || attempt === 1) throw error;
            invalidate(`/videos/${id}/`);
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
