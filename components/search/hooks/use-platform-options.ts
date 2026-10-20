"use client";
import { useEffect, useState } from "react";
import { cachedGet } from "@/lib/api-cache";
import { listPlatforms } from "@/lib/platforms";

/** Platforms offered by the filter: the built-in registry at once, replaced by the backend's list when it arrives. */
export function usePlatformOptions() {
  const [ids, setIds] = useState(() => listPlatforms().map((p) => p.id));
  useEffect(() => {
    let live = true;
    cachedGet("/platforms").then((page) => { if (live) setIds(page.items.map((p) => p.id)); }, () => undefined);
    return () => { live = false; };
  }, []);
  return ids;
}
