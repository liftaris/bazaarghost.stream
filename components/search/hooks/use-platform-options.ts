"use client";
import { useState } from "react";
import type { GhostResult } from "@/lib/result-models";

/**
 * Platforms offered by the platform filter: those seen in results under the current text/streamer/channel
 * scope, kept while a platform is selected (the filtered results alone would hide the others).
 */
export function usePlatformOptions(results: GhostResult[], scope: string, selected: string | null) {
  const [seen, setSeen] = useState({ scope, platforms: [] as string[] });
  const known = seen.scope === scope ? seen.platforms : [];
  const merged = [...new Set([...known, ...results.flatMap((r) => r.sources.map((s) => s.platform))])];
  if (seen.scope !== scope || merged.length !== known.length) setSeen({ scope, platforms: merged });
  return selected && !merged.includes(selected) ? [...merged, selected] : merged;
}
