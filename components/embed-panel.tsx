"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Ghost,
  Search,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useEmbedActions,
  useEmbedState,
  useEmbedTime,
  type EmbedGhost,
} from "@/components/embed-provider";
import { PlayerSlot } from "@/components/player/player-slot";
import { BookmarkButton } from "@/components/social/bookmark-button";
import { cn, secondsToTwitchTimestamp } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const KNOWN_RANKS = new Set(["bronze", "silver", "gold", "diamond", "legend"]);

const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "today", "3 days ago", "2 months ago"; null when the date can't be parsed. */
function relativeDate(raw: string): { label: string; full: string } | null {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  const days = Math.round((date.getTime() - Date.now()) / 86_400_000);
  const label =
    days > -7 ? RELATIVE.format(days, "day")
    : days > -60 ? RELATIVE.format(Math.round(days / 7), "week")
    : days > -700 ? RELATIVE.format(Math.round(days / 30), "month")
    : RELATIVE.format(Math.round(days / 365), "year");
  return {
    label,
    full: date.toLocaleDateString("en-US", { dateStyle: "long" }),
  };
}

/** Icon button with a tooltip naming it (also its accessible name). */
function IconButton({
  label,
  className,
  children,
  ...props
}: { label: string } & React.ComponentProps<typeof Button>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          className={cn("text-muted-foreground hover:text-foreground", className)}
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// Timeline sub-component
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Fisheye constants
// ---------------------------------------------------------------------------

/** Radius of influence in pixels around the cursor for vertical bulge */
const FISHEYE_RADIUS = 80;
/** Max height of the bar at cursor center (px). Rest height is 8px. */
const BAR_HEIGHT_REST = 8;
const BAR_HEIGHT_MAX = 24;
/** Max distance (px) at which the nearest ghost will snap to cursor */
const SNAP_THRESHOLD = 40;
/** Horizontal push radius — ghosts within this range get displaced */
const PUSH_RADIUS = 80;
/** Max push displacement in pixels */
const PUSH_STRENGTH = 20;

/**
 * Compute a smooth 0→1 influence factor based on distance from cursor.
 * Returns 0 outside FISHEYE_RADIUS, 1 at the cursor, smooth in between.
 */
function fisheyeInfluence(px: number, cursorPx: number): number {
  const d = Math.abs(px - cursorPx);
  if (d >= FISHEYE_RADIUS) return 0;
  // Cosine bell — smooth at both the peak and the edges (zero derivative)
  return (1 + Math.cos((Math.PI * d) / FISHEYE_RADIUS)) / 2;
}

/** Bar height at a given pixel X position */
function barHeightAt(px: number, cursorX: number | null): number {
  const influence = cursorX !== null ? fisheyeInfluence(px, cursorX) : 0;
  return BAR_HEIGHT_REST + influence * (BAR_HEIGHT_MAX - BAR_HEIGHT_REST);
}

/**
 * Compute horizontal offsets for all ghosts.
 * - The nearest ghost within SNAP_THRESHOLD snaps toward the cursor.
 * - All other ghosts within PUSH_RADIUS get pushed away from the cursor.
 */
function computeGhostOffsets(
  ghostPositions: number[],
  cursorX: number | null
): { offsets: number[]; snappedIdx: number | null } {
  const offsets = new Array(ghostPositions.length).fill(0) as number[];
  if (cursorX === null || ghostPositions.length === 0)
    return { offsets, snappedIdx: null };

  // Find nearest ghost
  let nearestIdx = 0;
  let nearestDist = Math.abs(ghostPositions[0] - cursorX);
  for (let i = 1; i < ghostPositions.length; i++) {
    const d = Math.abs(ghostPositions[i] - cursorX);
    if (d < nearestDist) {
      nearestDist = d;
      nearestIdx = i;
    }
  }

  for (let i = 0; i < ghostPositions.length; i++) {
    const px = ghostPositions[i];
    const dist = px - cursorX;
    const absDist = Math.abs(dist);

    if (i === nearestIdx && nearestDist <= SNAP_THRESHOLD) {
      // Snap nearest ghost toward cursor
      const snapT = 1 - nearestDist / SNAP_THRESHOLD;
      const ease = snapT * snapT;
      offsets[i] = -dist * ease * 0.8; // move 80% of the way to cursor at max
    } else if (absDist < PUSH_RADIUS) {
      // Push other ghosts away from cursor
      const t = 1 - absDist / PUSH_RADIUS;
      const ease = t * t;
      const sign = dist >= 0 ? 1 : -1;
      offsets[i] = sign * ease * PUSH_STRENGTH;
    }
  }

  const snappedIdx = nearestDist <= SNAP_THRESHOLD ? nearestIdx : null;
  return { offsets, snappedIdx };
}

/**
 * Generate an SVG path for the timeline bar that bulges downward around the cursor.
 * Top edge is flat at y=0; bottom edge curves down at the cursor.
 */
function buildBarPath(width: number, cursorX: number | null): string {
  if (width <= 0) return "";

  const steps = 200;
  const dx = width / steps;

  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = i * dx;
    points.push({ x, y: barHeightAt(x, cursorX) });
  }

  // Top-left → top-right (flat), then bottom edge curves back right-to-left
  let d = `M 0 0 L ${width} 0`;
  d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  for (let i = points.length - 2; i >= 0; i--) {
    const prev = points[i + 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx} ${prev.y} ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
  }
  d += ` Z`;
  return d;
}

// ---------------------------------------------------------------------------
// Ghost slit tooltip — always controlled to avoid uncontrolled↔controlled flip
// ---------------------------------------------------------------------------

interface GhostSlitTooltipProps {
  slit: {
    x: number;
    width: number;
    height: number;
    detection_id: string;
    username: string;
  };
  forceOpen: boolean;
}

function GhostSlitTooltip({ slit, forceOpen }: GhostSlitTooltipProps) {
  const [hoverOpen, setHoverOpen] = useState(false);
  const isOpen = forceOpen || hoverOpen;

  return (
    <div
      className="absolute top-0"
      style={{
        left: slit.x,
        width: Math.max(slit.width, 12),
        height: slit.height,
        transform:
          slit.width < 12
            ? `translateX(-${(12 - slit.width) / 2}px)`
            : undefined,
      }}
    >
      <Tooltip open={isOpen} onOpenChange={setHoverOpen}>
        <TooltipTrigger asChild>
          <div className="size-full" />
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {slit.username}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline sub-component
// ---------------------------------------------------------------------------

interface EmbedTimelineProps {
  currentTime: number;
  duration: number;
  bazaarChapters: number[] | null;
  ghosts: EmbedGhost[];
  currentGhostId: string | null;
  onSeekGhost: (ghost: EmbedGhost) => void;
}

function EmbedTimeline({
  currentTime,
  duration,
  bazaarChapters,
  ghosts,
  currentGhostId,
  onSeekGhost,
}: EmbedTimelineProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [cursorX, setCursorX] = useState<number | null>(null);
  const [barWidth, setBarWidth] = useState(0);

  // Measure bar width on mount and resize
  useEffect(() => {
    if (!barRef.current) return;
    const measure = () => {
      if (barRef.current)
        setBarWidth(barRef.current.getBoundingClientRect().width);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(barRef.current);
    return () => ro.disconnect();
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!barRef.current || duration <= 0 || ghosts.length === 0) return;
      const rect = barRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      // Find the ghost closest to the click position
      let nearestGhost = ghosts[0];
      let nearestDist = Math.abs(
        (ghosts[0].frame_time_seconds / duration) * rect.width - clickX
      );
      for (let i = 1; i < ghosts.length; i++) {
        const d = Math.abs(
          (ghosts[i].frame_time_seconds / duration) * rect.width - clickX
        );
        if (d < nearestDist) {
          nearestDist = d;
          nearestGhost = ghosts[i];
        }
      }
      onSeekGhost(nearestGhost);
    },
    [duration, onSeekGhost, ghosts]
  );

  const updateCursor = useCallback((clientX: number) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    setCursorX(clientX - rect.left);
    setBarWidth(rect.width);
  }, []);

  const clearCursor = useCallback(() => {
    setCursorX(null);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => updateCursor(e.clientX),
    [updateCursor]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length > 0) updateCursor(e.touches[0].clientX);
    },
    [updateCursor]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      // On release, seek to nearest ghost at last cursor position, then clear
      if (
        !barRef.current ||
        duration <= 0 ||
        ghosts.length === 0 ||
        cursorX === null
      ) {
        clearCursor();
        return;
      }
      const rect = barRef.current.getBoundingClientRect();
      let nearestGhost = ghosts[0];
      let nearestDist = Math.abs(
        (ghosts[0].frame_time_seconds / duration) * rect.width - cursorX
      );
      for (let i = 1; i < ghosts.length; i++) {
        const d = Math.abs(
          (ghosts[i].frame_time_seconds / duration) * rect.width - cursorX
        );
        if (d < nearestDist) {
          nearestDist = d;
          nearestGhost = ghosts[i];
        }
      }
      onSeekGhost(nearestGhost);
      clearCursor();
    },
    [duration, ghosts, cursorX, onSeekGhost, clearCursor]
  );

  // Parse bazaar chapter start/end pairs from the flat array
  const segments = useMemo(() => {
    const segs: { start: number; end: number }[] = [];
    if (bazaarChapters && bazaarChapters.length >= 2) {
      for (let i = 0; i < bazaarChapters.length - 1; i += 2) {
        segs.push({ start: bazaarChapters[i], end: bazaarChapters[i + 1] });
      }
    }
    return segs;
  }, [bazaarChapters]);

  // Compute all SVG data in one pass
  const svgData = useMemo(() => {
    if (barWidth <= 0 || duration <= 0) return null;

    const barPath = buildBarPath(barWidth, cursorX);

    // Chapter rects
    const chapterRects = segments.map((seg) => ({
      x: (seg.start / duration) * barWidth,
      width: Math.max(((seg.end - seg.start) / duration) * barWidth, 2),
    }));

    // Ghost slit positions + dimensions
    const naturalPositions = ghosts.map(
      (g) => (g.frame_time_seconds / duration) * barWidth
    );
    const { offsets, snappedIdx } = computeGhostOffsets(
      naturalPositions,
      cursorX
    );
    const ghostSlits = ghosts.map((ghost, i) => {
      const displacedX = Math.max(
        0,
        Math.min(barWidth, naturalPositions[i] + offsets[i])
      );
      const h = barHeightAt(displacedX, cursorX);
      const isActive = ghost.detection_id === currentGhostId;
      const isSnapped = i === snappedIdx;
      const w = isSnapped ? 4 : isActive ? 4 : 2;
      return {
        x: Math.max(0, Math.min(barWidth - w, displacedX - w / 2)),
        y: 0,
        width: w,
        height: isActive ? h + 4 : h,
        isActive,
        isSnapped,
        username: ghost.username,
        detection_id: ghost.detection_id,
      };
    });

    // Seek indicator
    const seekX = (currentTime / duration) * barWidth;
    const seekH = barHeightAt(seekX, cursorX) + 2;

    return { barPath, chapterRects, ghostSlits, seekX, seekH };
  }, [
    barWidth,
    cursorX,
    duration,
    segments,
    ghosts,
    currentGhostId,
    currentTime,
  ]);

  return (
    <div
      ref={barRef}
      data-timeline
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={clearCursor}
      onTouchStart={handleTouchMove}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={clearCursor}
      className="relative w-full cursor-pointer touch-none"
      style={{ height: BAR_HEIGHT_MAX }}
    >
      {/* Unified SVG: bar + chapters + ghost slits + seek indicator */}
      {svgData && (
        <svg
          className="absolute inset-0 overflow-visible"
          width={barWidth}
          height={BAR_HEIGHT_MAX}
        >
          <defs>
            <clipPath id="bar-bulge">
              <path d={svgData.barPath} />
            </clipPath>
          </defs>

          {/* Muted background bar */}
          <path d={svgData.barPath} className="fill-muted" opacity={0.5} />

          {/* Bazaar chapter segments clipped to bar shape */}
          {svgData.chapterRects.map((rect, i) => (
            <rect
              key={i}
              x={rect.x}
              y={0}
              width={rect.width}
              height={BAR_HEIGHT_MAX}
              className="fill-chart-3"
              clipPath="url(#bar-bulge)"
            />
          ))}

          {/* Ghost slits */}
          {svgData.ghostSlits.map((slit) => (
            <rect
              key={slit.detection_id}
              x={slit.x}
              y={slit.y}
              width={slit.width}
              height={slit.height}
              rx={1}
              className="fill-accent"
            />
          ))}

          {/* Seek position indicator */}
          <rect
            x={svgData.seekX - 1.5}
            y={0}
            width={3}
            height={svgData.seekH}
            rx={1.5}
            className="fill-black stroke-white"
            strokeWidth={1}
          />
        </svg>
      )}

      {/* Invisible DOM overlays for Radix tooltips */}
      {svgData?.ghostSlits.map((slit) => (
        <GhostSlitTooltip
          key={slit.detection_id}
          slit={slit}
          forceOpen={slit.isSnapped && cursorX !== null}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EmbedPanel
// ---------------------------------------------------------------------------

/** Reads playback time itself so only the timeline re-renders while playing. */
function TimelineTrack({
  duration,
  bazaarChapters,
  ghosts,
  currentGhostId,
  onSeekGhost,
}: Omit<EmbedTimelineProps, "currentTime">) {
  const currentTime = useEmbedTime((s) => s.currentTime);
  return (
    <EmbedTimeline
      currentTime={currentTime}
      duration={duration}
      bazaarChapters={bazaarChapters}
      ghosts={ghosts}
      currentGhostId={currentGhostId}
      onSeekGhost={onSeekGhost}
    />
  );
}

export function EmbedPanel() {
  const {
    videoId,
    playback,
    timestamp,
    meta,
    isVisible,
    isReady,
    ghosts: sortedGhosts,
    activeGhost: currentGhost,
    ghostIsOptimistic,
    bazaarChapters,
  } = useEmbedState();
  const { hideEmbed, seek, setActiveGhost } = useEmbedActions();
  const duration = useEmbedTime((s) => s.duration);
  const pathname = usePathname();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  /**
   * Build the canonical URL path for the given ghost + VOD context.
   * Returns `/:streamer/:vodId/:ghost` or `/:streamer/:vodId`.
   */
  const buildGhostUrl = useCallback(
    (
      ghost: EmbedGhost | null,
      overrideVideoId?: string,
      overrideStreamer?: string
    ) => {
      const vid = overrideVideoId ?? videoId;
      if (!vid) return null;
      return ghost?.matchup_id ? `/matchups/${ghost.matchup_id}`
        : vid.startsWith("v:") ? `/videos/${vid.slice(2)}`
        : `/${encodeURIComponent(overrideStreamer ?? meta?.streamerName ?? "")}/${vid}`;
    },
    [videoId, meta?.streamerName]
  );

  /**
   * Push a new history entry for a user-triggered ghost change (row click,
   * arrow nav, timeline click). Since the (app)/layout.tsx persists across
   * these routes, only the leaf page.tsx re-renders — the embed, search
   * panel, and navbar are unaffected.
   */
  const pushGhostUrl = useCallback(
    (
      ghost: EmbedGhost | null,
      overrideVideoId?: string,
      overrideStreamer?: string
    ) => {
      const url = buildGhostUrl(ghost, overrideVideoId, overrideStreamer);
      if (url && pathname !== url) {
        router.push(url, { scroll: false });
      }
    },
    [buildGhostUrl, pathname, router]
  );

  /**
   * Passive playback advancing past a ghost: rewrite the URL in place with
   * history.replaceState (no Next navigation, no RSC request, no re-seek).
   * Optimistic (user-initiated) changes own their URL via router.push.
   */
  const prevPassiveGhostRef = useRef<string | null>(null);
  useEffect(() => {
    const ghostId = currentGhost?.detection_id ?? null;
    if (ghostId === prevPassiveGhostRef.current) return;
    prevPassiveGhostRef.current = ghostId;
    if (!currentGhost || ghostIsOptimistic) return;

    const url = buildGhostUrl(currentGhost);
    const here = window.location.pathname;
    if (url && here !== url && (here.startsWith("/matchups/") || here.startsWith("/videos/"))) {
      window.history.replaceState(window.history.state, "", url);
    }
  }, [currentGhost, ghostIsOptimistic, buildGhostUrl]);

  // ---- Position: ghosts are sorted by time; -1 = before the first ghost ----
  const ghostIndex = useMemo(
    () =>
      currentGhost
        ? sortedGhosts.findIndex((g) => g.detection_id === currentGhost.detection_id)
        : -1,
    [sortedGhosts, currentGhost]
  );
  const isAtFirstGhost = ghostIndex <= 0;
  const isAtLastGhost = sortedGhosts.length === 0 || ghostIndex === sortedGhosts.length - 1;

  // ---- Seek to a ghost: optimistic update + player seek + URL push ----
  const seekToGhost = useCallback(
    (ghost: EmbedGhost) => {
      setActiveGhost(ghost);
      pushGhostUrl(ghost);
      seek(ghost.frame_time_seconds);
    },
    [seek, setActiveGhost, pushGhostUrl]
  );

  // ---- Arrow navigation: prev/next ghost ----
  const navigatePrevGhost = useCallback(() => {
    const target = sortedGhosts[ghostIndex - 1];
    if (target) seekToGhost(target);
  }, [sortedGhosts, ghostIndex, seekToGhost]);

  const navigateNextGhost = useCallback(() => {
    const target = sortedGhosts[ghostIndex + 1];
    if (target) seekToGhost(target);
  }, [sortedGhosts, ghostIndex, seekToGhost]);

  const copyLink = useCallback(() => {
    if (!videoId) return;
    const path = buildGhostUrl(currentGhost);
    if (path && videoId.startsWith("v:")) {
      navigator.clipboard.writeText(`${window.location.origin}${path}`);
    } else {
      const t = secondsToTwitchTimestamp(timestamp ?? 0);
      const url = playback?.player.platform === "twitch" ? `https://www.twitch.tv/videos/${playback.player.sourceId}?t=${t}` : playback?.player.watchUrl ?? "";
      navigator.clipboard.writeText(url);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }, [videoId, buildGhostUrl, currentGhost, timestamp, playback]);

  const showChrome = isVisible && !!videoId;
  const when = meta?.date ? relativeDate(meta.date) : null;
  const rank = currentGhost?.rank?.toLowerCase();
  const twitchOnly = !playback || playback.player.platform === "twitch";

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden border-border bg-card md:m-2 md:rounded-lg md:border",
        !showChrome && "max-md:hidden"
      )}
    >
      {/* The persistent PlayerHost is positioned over this slot */}
      <div className="relative">
        <PlayerSlot />
        {!showChrome && (
          <div aria-hidden className="absolute inset-0 grid place-items-center bg-muted">
            <Ghost className="size-16 text-muted-foreground/25" strokeWidth={1.25} />
          </div>
        )}
        {playback && playback.processing.remainingRanges.length > 0 && (
          <p className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-card/80 px-3 py-1 text-xs text-muted-foreground">Processing is incomplete. More matchups may appear as the remaining sections finish.</p>
        )}
      </div>

      {/* One control row: prev · ghost · next | save · search · copy · close */}
      <div className="flex h-12 items-center gap-0.5 border-t border-border px-2">
        <IconButton label="Previous ghost" onClick={navigatePrevGhost} disabled={!showChrome || isAtFirstGhost}>
          <ChevronLeft />
        </IconButton>
        <button
          type="button"
          disabled={!currentGhost}
          onClick={() => currentGhost && seek(currentGhost.frame_time_seconds)}
          className="flex h-8 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md px-1 text-sm font-medium text-foreground transition-colors enabled:cursor-pointer enabled:hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {showChrome && currentGhost ? (
            <>
              {rank && KNOWN_RANKS.has(rank) && (
                <Image
                  src={`/${rank}.webp`}
                  alt={currentGhost.rank ?? ""}
                  width={24}
                  height={24}
                  unoptimized
                  className="shrink-0"
                />
              )}
              <span className="truncate">{currentGhost.username}</span>
              {ghostIndex >= 0 && (
                <span className="shrink-0 font-mono text-xs font-normal tabular-nums text-muted-foreground">
                  {ghostIndex + 1}/{sortedGhosts.length}
                </span>
              )}
            </>
          ) : (
            <Skeleton className="h-4 w-28 bg-muted" />
          )}
        </button>
        <IconButton label="Next ghost" onClick={navigateNextGhost} disabled={!showChrome || isAtLastGhost}>
          <ChevronRight />
        </IconButton>

        <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-5" />

        {currentGhost?.matchup_id ? (
          <BookmarkButton matchupId={currentGhost.matchup_id} tooltip />
        ) : null}
        {currentGhost && (
          <IconButton
            label="Search ghost"
            onClick={() => router.push(`/search?q=${encodeURIComponent(currentGhost.username)}`, { scroll: false })}
          >
            <Search />
          </IconButton>
        )}
        <IconButton label={copied ? "Copied" : "Copy link"} onClick={copyLink} disabled={!showChrome}>
          {copied ? <Check /> : <Copy />}
        </IconButton>
        <IconButton label="Close player" onClick={hideEmbed} disabled={!showChrome}>
          <X />
        </IconButton>
      </div>

      {/* Stream info — fixed height so late data doesn't shift layout */}
      <div className="flex h-8 items-center gap-2 border-t border-border px-3 text-xs text-muted-foreground">
        {showChrome && meta ? (
          <>
            <Badge variant="outline" asChild className="min-w-0 max-w-[40%] cursor-pointer text-foreground">
              <button
                type="button"
                onClick={() =>
                  router.push(`/search?streamer=${encodeURIComponent(meta.streamerName)}`, { scroll: false })
                }
              >
                <Avatar className="size-4 shrink-0">
                  <AvatarImage src={meta.streamerAvatar || undefined} alt="" />
                  <AvatarFallback className="bg-primary text-[8px] text-primary-foreground">
                    {meta.streamerName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{meta.streamerName}</span>
              </button>
            </Badge>
            <span className="min-w-0 flex-1 truncate">{meta.vodTitle}</span>
            {when && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <time dateTime={meta.date} className="shrink-0">{when.label}</time>
                </TooltipTrigger>
                <TooltipContent>{when.full}</TooltipContent>
              </Tooltip>
            )}
            {isReady && sortedGhosts.length > 0 && (
              <span
                role="img"
                aria-label={`${sortedGhosts.length} ghosts`}
                className="inline-flex shrink-0 items-center gap-1 tabular-nums"
              >
                <Ghost className="size-3.5" />
                {sortedGhosts.length}
              </span>
            )}
          </>
        ) : (
          <Skeleton className="h-3 w-48 bg-muted" />
        )}
      </div>

      {/* Timeline — fixed-height slot so late data doesn't shift layout */}
      {twitchOnly && (
        <div className="h-[52px] border-t border-border px-3 py-3">
          {showChrome && isReady && duration > 0 ? (
            <TimelineTrack
              duration={duration}
              bazaarChapters={bazaarChapters}
              ghosts={sortedGhosts}
              currentGhostId={currentGhost?.detection_id ?? null}
              onSeekGhost={seekToGhost}
            />
          ) : (
            <Skeleton className="h-full w-full bg-muted" />
          )}
        </div>
      )}
    </div>
  );
}
