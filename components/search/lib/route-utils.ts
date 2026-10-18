import type { SearchMode, RouteContext } from "../types";

/**
 * Reserved top-level names that must NOT be matched by the dynamic `[streamer]`
 * catch-all. Used by {@link deriveRouteContext} and the `[streamer]` page.
 */
export const RESERVED_TOP_LEVEL = [
  "search",
  "streamers",
  "vods",
  "saved",
  "ghost",
  "login",
  "account",
  "contact",
  "donate",
  "how-it-works",
  "api",
  "matchups",
  "videos",
];

const STATIC_PREFIXES = RESERVED_TOP_LEVEL.map((name) => `/${name}`);

/**
 * Derive the active {@link SearchMode} from the current pathname.
 *
 * - `/streamers` -> `"streamers"`
 * - `/vods`      -> `"vods"`
 * - Everything else (`/search`, `/:streamer`, `/ghost/*`, `/`) -> `"ghosts"`
 *
 * @param pathname - The Next.js `usePathname()` value.
 * @returns The search mode that should be active for this route.
 */
export function deriveSearchMode(pathname: string): SearchMode {
  if (pathname.startsWith("/streamers")) return "streamers";
  if (pathname.startsWith("/vods")) return "vods";
  if (pathname.startsWith("/saved")) return "saved";
  return "ghosts";
}

/**
 * Extract implicit filter values embedded in the URL path segments.
 *
 * Handles route patterns (checked in order of specificity):
 *
 * 1. `/:streamer/:vodId/:ghost` — ghost matchup route
 * 2. `/:streamer/:vodId` — VOD embed route
 * 3. `/:streamer` — streamer page
 * 4. `/ghost/:username` — ghost profile route
 *
 * Static routes (`/search`, `/contact`, etc.) return nulls.
 * Values are URI-decoded.
 *
 * @param pathname - The Next.js `usePathname()` value.
 * @returns A {@link RouteContext} with any path-implied filter values.
 */
export function deriveRouteContext(pathname: string): RouteContext {
  const empty: RouteContext = {
    pathStreamer: null,
    pathVodId: null,
    pathUsername: null,
  };

  const video = pathname.match(/^\/videos\/(\d+)$/);
  if(video)return {...empty,pathVodId:`v:${video[1]}`};

  // Bail out on known static prefixes
  if (
    STATIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))
  ) {
    // Special case: /ghost/:username sets pathUsername
    const ghostMatch = pathname.match(/^\/ghost\/([^/]+)/);
    if (ghostMatch) {
      return { ...empty, pathUsername: decodeURIComponent(ghostMatch[1]) };
    }
    return empty;
  }

  // Split into segments: /:streamer, /:streamer/:vodId, /:streamer/:vodId/:ghost
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length >= 3) {
    // /:streamer/:vodId/:ghost
    return {
      pathStreamer: decodeURIComponent(segments[0]),
      pathVodId: decodeURIComponent(segments[1]),
      pathUsername: decodeURIComponent(segments[2]),
    };
  }

  if (segments.length === 2) {
    // /:streamer/:vodId
    return {
      pathStreamer: decodeURIComponent(segments[0]),
      pathVodId: decodeURIComponent(segments[1]),
      pathUsername: null,
    };
  }

  if (segments.length === 1) {
    // /:streamer
    return {
      pathStreamer: decodeURIComponent(segments[0]),
      pathVodId: null,
      pathUsername: null,
    };
  }

  return empty;
}
