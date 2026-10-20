"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { deriveSearchMode, deriveSelection, MODE_PATHS } from "../lib/route-utils";
import { parseDay, parsePlatformList } from "@/lib/search-filters";
import { useWorkspaceActive } from "@/components/workspace-context";
import type { SearchMode, Selection } from "../types";

/** Params every list shares; a selection URL carries them so reload and back restore both panes. */
const LIST_PARAMS = ["q", "platform", "xplatform", "from", "to", "streamer", "channel"] as const;
/** Params that survive a mode switch, per target mode (the text query is per mode). */
const MODE_PARAMS: Record<SearchMode, readonly string[]> = {
  ghosts: ["platform", "xplatform", "from", "to", "streamer"],
  recordings: ["platform", "xplatform", "from", "to", "streamer"],
  streamers: ["platform", "xplatform"],
  saved: [],
};
const DEBOUNCE_MS = 300;

export type ParamOverrides = Record<string, string | null | undefined>;

/**
 * The search workspace's URL model: mode and selection come from the path, list filters from the
 * query string. List filters change with `history.replaceState` (no server round trip); modes and
 * selections change with client navigation.
 */
export function useSearchUrl() {
  const router = useRouter();
  const livePathname = usePathname();
  const liveSearch = useSearchParams().toString();
  // While the workspace is hidden (content routes) keep the last workspace
  // location so the mounted-but-hidden panel doesn't react to /account?q=…
  const workspaceActive = useWorkspaceActive();
  const [lastWorkspace, setLastWorkspace] = useState({ pathname: livePathname, search: liveSearch });
  if (workspaceActive && (lastWorkspace.pathname !== livePathname || lastWorkspace.search !== liveSearch))
    setLastWorkspace({ pathname: livePathname, search: liveSearch });
  const { pathname, search } = workspaceActive ? { pathname: livePathname, search: liveSearch } : lastWorkspace;
  const params = useMemo(() => new URLSearchParams(search), [search]);

  const mode: SearchMode = deriveSearchMode(pathname);
  const selection: Selection | null = useMemo(() => deriveSelection(pathname), [pathname]);
  const queryParam = params.get("q") ?? "";
  const includeKey = params.get("platform");
  const excludeKey = params.get("xplatform");
  const include = useMemo(() => parsePlatformList(includeKey), [includeKey]);
  const exclude = useMemo(() => parsePlatformList(excludeKey).filter((id) => !include.includes(id)), [excludeKey, include]);
  const from = parseDay(params.get("from"));
  const to = parseDay(params.get("to"));
  const streamerParam = params.get("streamer");
  const channelParam = params.get("channel");
  const recordingParam = params.get("recording");
  const sourceParam = params.get("source");

  // ---- Local controlled input ----
  const [inputValue, setInputValue] = useState(queryParam);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [syncedQuery, setSyncedQuery] = useState(queryParam);
  if (syncedQuery !== queryParam) {
    setSyncedQuery(queryParam);
    setInputValue(queryParam);
  }

  /** Change list params in place: no navigation, no server request. */
  const setParams = useCallback((overrides: ParamOverrides) => {
    const live = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(overrides)) {
      if (value) live.set(key, value);
      else live.delete(key);
    }
    const qs = live.toString();
    const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    if (url !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, "", url);
  }, []);

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setParams({ q: value || null }), DEBOUNCE_MS);
  }, [setParams]);

  /** The list params as a query string, to carry onto a selection URL. */
  const listQuery = useMemo(() => {
    const out = new URLSearchParams();
    for (const key of LIST_PARAMS) {
      const value = params.get(key);
      if (value) out.set(key, value);
    }
    return out.toString();
  }, [params]);

  /** A selection URL: the path plus the current list params (and any extras). */
  const selectionHref = useCallback((path: string, extra: Record<string, string> = {}) => {
    const out = new URLSearchParams(listQuery);
    for (const [key, value] of Object.entries(extra)) out.set(key, value);
    const qs = out.toString();
    return `${path}${qs ? `?${qs}` : ""}`;
  }, [listQuery]);

  /** Switch mode with client navigation, keeping only the filters the target mode has. */
  const switchMode = useCallback((target: Exclude<SearchMode, "saved">) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const out = new URLSearchParams();
    for (const key of MODE_PARAMS[target]) {
      const value = params.get(key);
      if (value) out.set(key, value);
    }
    if (target === "ghosts" && channelParam) out.set("channel", channelParam);
    const qs = out.toString();
    setInputValue("");
    router.push(`${MODE_PATHS[target]}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [router, params, channelParam]);

  return {
    mode, selection,
    filters: { q: queryParam, include, exclude, from, to },
    streamerParam, channelParam, recordingParam, sourceParam,
    inputValue, handleInputChange,
    setParams, listQuery, selectionHref, switchMode,
  };
}
