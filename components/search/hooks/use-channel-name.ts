"use client";
import { useEffect, useState } from "react";
import { cachedGet } from "@/lib/api-cache";
/** Display name of the `?channel=` filter's Channel. */
export function useChannelName(channelId: string | null) {
 const [loaded, setLoaded] = useState<{ id: string; name: string } | null>(null);
 useEffect(() => {
  if (!channelId) return;
  const controller = new AbortController();
  cachedGet(`/channels/${encodeURIComponent(channelId)}`, {}, { signal: controller.signal })
   .then(({ channel }) => setLoaded({ id: channelId, name: channel.displayName }))
   .catch(() => undefined);
  return () => controller.abort();
 }, [channelId]);
 return channelId ? (loaded?.id === channelId ? loaded.name : "Channel") : null;
}
