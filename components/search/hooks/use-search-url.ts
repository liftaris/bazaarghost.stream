"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { deriveSearchMode, deriveRouteContext } from "../lib/route-utils";
import type { SearchMode, RouteContext } from "../types";

/**
 * Return type for {@link useSearchUrl}.
 */
export interface UseSearchUrlReturn {
  /** Current search mode derived from pathname */
  searchMode: SearchMode;
  /** Route context derived from pathname */
  routeContext: RouteContext;
  /** The raw `?q=` query param */
  queryParam: string;
  /** The `?streamer=` param */
  streamerParam: string | null;
  /** The `?vod=` param */
  vodParam: string | null;
  /** Effective streamer (param or path-derived) */
  effectiveStreamer: string | null;
  /** Effective vod (param or path-derived) */
  effectiveVod: string | null;
  /** Controlled input value (synced to queryParam) */
  inputValue: string;
  /** Update the controlled input and debounce-push ?q= to URL */
  handleInputChange: (value: string) => void;
  /** Replace URL params while staying on the current path */
  replaceParams: (overrides: Record<string, string | null | undefined>) => void;
  /** Build a URL string with param overrides */
  buildSearchUrl: (
    overrides?: Record<string, string | null | undefined>
  ) => string;
}

/**
 * Manages bidirectional sync between the search UI and the URL.
 *
 * Reads the current search mode, query, streamer, and VOD filters from the
 * URL (both path segments and query params).  Provides helpers to mutate the
 * URL when the user types in the search input or changes filters.
 *
 * The search input is debounced (300 ms) so that each keystroke does not
 * trigger a navigation.
 *
 * @returns A {@link UseSearchUrlReturn} object with derived state and mutation helpers.
 */
export function useSearchUrl(): UseSearchUrlReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ---- Derived state from URL ----
  const searchMode = deriveSearchMode(pathname);
  const routeContext = deriveRouteContext(pathname);
  const queryParam = searchParams.get("q") ?? "";
  const streamerParam = searchParams.get("streamer") ?? null;
  const vodParam = searchParams.get("vod") ?? null;

  // Only use the explicit ?streamer= param — path-derived streamer should
  // not constrain the search filter when navigating to a ghost result.
  const effectiveStreamer = streamerParam ?? routeContext.pathStreamer;
  const effectiveVod = vodParam ?? routeContext.pathVodId;

  // ---- Local controlled input ----
  const [inputValue, setInputValue] = useState(queryParam);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  // Sync input value when URL changes (e.g. back/forward)
  useEffect(() => {
    setInputValue(queryParam);
  }, [queryParam]);

  /**
   * Build a full URL string from the current path + params, with selective
   * overrides.  Pass `_basePath` to change the route entirely.
   */
  const buildSearchUrl = useCallback(
    (overrides: Record<string, string | null | undefined> = {}) => {
      const params = new URLSearchParams();
      const q = overrides.q !== undefined ? overrides.q : searchParams.get("q");
      if (q) params.set("q", q);

      const streamer =
        overrides.streamer !== undefined
          ? overrides.streamer
          : searchParams.get("streamer");
      if (streamer) params.set("streamer", streamer);

      const vod =
        overrides.vod !== undefined ? overrides.vod : searchParams.get("vod");
      if (vod) params.set("vod", vod);

      let basePath = pathname;
      if (overrides._basePath !== undefined) {
        basePath = overrides._basePath ?? "/search";
      }

      const qs = params.toString();
      return `${basePath}${qs ? `?${qs}` : ""}`;
    },
    [pathname, searchParams]
  );

  /** Replace URL query params via `router.replace` (no scroll). */
  const replaceParams = useCallback(
    (overrides: Record<string, string | null | undefined>) => {
      const url = buildSearchUrl(overrides);
      router.replace(url, { scroll: false });
    },
    [router, buildSearchUrl]
  );

  /** Update the controlled input value and debounce-push `?q=` to the URL. */
  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value);

      if (searchTimer.current) clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => {
        replaceParams({ q: value || null });
      }, 300);
    },
    [replaceParams]
  );

  return {
    searchMode,
    routeContext,
    queryParam,
    streamerParam,
    vodParam,
    effectiveStreamer,
    effectiveVod,
    inputValue,
    handleInputChange,
    replaceParams,
    buildSearchUrl,
  };
}
