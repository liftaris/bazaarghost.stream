"use client";
import { useEffect, useState } from "react";
import { cachedGet } from "@/lib/api-cache";
import { streamerOption } from "@/lib/result-models";
import type { Streamer } from "@/lib/api-contract";
import { useApiPage } from "./use-api-page";

/** A positive integer Streamer id, or null. */
export function streamerIdOf(value: string | null): string | null {
 return value && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)) ? value : null;
}

/** One Streamer with its Channels; cached, so every caller shares one request. */
export function useStreamer(id: string | null) {
 const [loaded, setLoaded] = useState<{ id: string; streamer: Streamer | null; error: string | null } | null>(null);
 useEffect(() => {
  if (!id) return;
  const controller = new AbortController();
  cachedGet(`/streamers/${Number(id)}`, {}, { signal: controller.signal }).then(
   (streamer) => { if (!controller.signal.aborted) setLoaded({ id, streamer, error: null }); },
   (error) => { if (!controller.signal.aborted) setLoaded({ id, streamer: null, error: error instanceof Error ? error.message : "Could not load streamer" }); },
  );
  return () => controller.abort();
 }, [id]);
 const current = id && loaded?.id === id ? loaded : null;
 return { streamer: current?.streamer ?? null, error: current?.error ?? null };
}

/** The streamer picker: server-side search while open, plus the display data of the selected Streamer. */
export function useStreamerOptions({ streamerId, onSelect }: { streamerId: string | null; onSelect: (id: string | null) => void }) {
 const [open, setOpen] = useState(false);
 const [pickerQuery, setPickerQuery] = useState("");
 const [debouncedQuery, setDebouncedQuery] = useState("");
 useEffect(() => { const timer = setTimeout(() => setDebouncedQuery(pickerQuery), 250); return () => clearTimeout(timer); }, [pickerQuery]);
 const result = useApiPage("/streamers", { q: debouncedQuery }, open);
 const { streamer, error: resolveError } = useStreamer(streamerId);
 return {
  options: result.items.map(streamerOption),
  resolved: streamer ? { id: String(streamer.id), displayName: streamer.displayName, avatar: streamer.avatarUrl ?? "" } : null,
  open, setOpen, pickerQuery, setPickerQuery,
  hasMore: result.hasMore, loadMore: result.loadMore,
  error: resolveError ?? result.error, retry: result.retry,
  select: (id: string | null) => { onSelect(id); setOpen(false); },
 };
}
