"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Ghost,
  Pause,
  Play,
  Search,
  User,
  Video,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEmbed, type EmbedGhost } from "@/components/embed-provider";
import { BookmarkButton } from "@/components/social/bookmark-button";
import { cn, secondsToTwitchTimestamp } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
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

export function EmbedPanel() {
  const {
    videoId,
    playback,
    timestamp,
    meta,
    isVisible,
    hideEmbed,
    containerId,
    error,
    isReady,
    isPaused,
    isMuted,
    currentTime,
    duration,
    togglePlay,
    toggleMute,
    seek,
    ghosts: sortedGhosts,
    activeGhost: currentGhost,
    setActiveGhost,
    bazaarChapters,
  } = useEmbed();
  const pathname = usePathname();
  const router = useRouter();

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
   * Reactive fallback: replace the URL (no history entry) when
   * `currentGhost` changes during passive playback (the Twitch player
   * advances past a ghost timestamp without user interaction).
   */
  const prevPassiveGhostRef = useRef<string | null>(null);
  useEffect(() => {
    const ghostId = currentGhost?.detection_id ?? null;
    // Only fire for passive changes — skip if this was a user-triggered change
    // (those already called pushGhostUrl)
    if (ghostId === prevPassiveGhostRef.current) return;
    prevPassiveGhostRef.current = ghostId;

    const url = buildGhostUrl(currentGhost);
    if (url && pathname !== url) {
      router.replace(url, { scroll: false });
    }
  }, [currentGhost, buildGhostUrl, pathname, router]);

  // ---- Boundary detection: at first/last ghost ----
  const isAtFirstGhost = useMemo(() => {
    if (sortedGhosts.length === 0 || !currentGhost) return true;
    return (
      currentGhost.detection_id === sortedGhosts[0].detection_id &&
      currentTime < sortedGhosts[0].frame_time_seconds + 2
    );
  }, [sortedGhosts, currentGhost, currentTime]);

  const isAtLastGhost = useMemo(() => {
    if (sortedGhosts.length === 0 || !currentGhost) return true;
    return (
      currentGhost.detection_id ===
        sortedGhosts[sortedGhosts.length - 1].detection_id &&
      currentTime >=
        sortedGhosts[sortedGhosts.length - 1].frame_time_seconds - 2
    );
  }, [sortedGhosts, currentGhost, currentTime]);

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
    if (sortedGhosts.length === 0) return;
    // Find the ghost before current time (with a small buffer so tapping prev
    // at the exact ghost time goes to the one before it)
    const buffer = 2;
    for (let i = sortedGhosts.length - 1; i >= 0; i--) {
      if (sortedGhosts[i].frame_time_seconds < currentTime - buffer) {
        seekToGhost(sortedGhosts[i]);
        return;
      }
    }
    // If nothing before, go to first ghost
    seekToGhost(sortedGhosts[0]);
  }, [sortedGhosts, currentTime, seekToGhost]);

  const navigateNextGhost = useCallback(() => {
    if (sortedGhosts.length === 0) return;
    for (const g of sortedGhosts) {
      if (g.frame_time_seconds > currentTime + 2) {
        seekToGhost(g);
        return;
      }
    }
    // If nothing after, go to last ghost
    seekToGhost(sortedGhosts[sortedGhosts.length - 1]);
  }, [sortedGhosts, currentTime, seekToGhost]);

  const showChrome = isVisible && !!videoId;

  return (
    <div
      className={cn(
        "flex  flex-col overflow-hidden bg-card border-border border rounded-lg m-2",
        !showChrome && "invisible h-0 overflow-hidden"
      )}
    >
      {/* Player area — always mounted so the Twitch iframe is never destroyed */}
      <div className="relative aspect-video w-full">
        <div id={containerId} className="size-full" />
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-sm text-destructive">
            Error loading player: {error}
          </div>
        )}
      </div>

      {playback && playback.processing.remainingRanges.length > 0 && (
        <p className="px-3 py-1 text-xs text-muted-foreground">Processing is incomplete. More matchups may appear as the remaining sections finish.</p>
      )}
      {/* Controls area */}
      <div>
        {/* Row 1: Meta + current ghost + controls — 3-col grid for true centering */}
        <div className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-border bg-card px-3 py-2">
          {/* Left: streamer meta */}
          <div className="flex min-w-0 items-center gap-2">
            {meta && (
              <>
                <Avatar className="size-6 shrink-0">
                  <AvatarImage
                    src={meta.streamerAvatar || undefined}
                    alt={meta.streamerName}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                    {meta.streamerName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-xs font-medium text-card-foreground">
                  {meta.streamerName}
                </span>
              </>
            )}
            {!meta && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Video className="size-3" />
                <span>Video {videoId}</span>
              </div>
            )}
          </div>

          {/* Center: prev arrow + current ghost name + next arrow */}
          <div className="flex items-center justify-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
              title="Previous ghost"
              onClick={navigatePrevGhost}
              disabled={isAtFirstGhost}
            >
              <ArrowLeft className="size-3.5" />
            </Button>
            {currentGhost ? (
              <button
                type="button"
                onClick={() => seek(currentGhost.frame_time_seconds)}
                className="flex min-w-[150px] cursor-pointer items-center justify-center gap-1.5 text-sm font-medium text-foreground hover:text-accent transition-colors"
              >
                {currentGhost.rank && (
                  <Image
                    src={`/${currentGhost.rank.toLowerCase()}.webp`}
                    alt={currentGhost.rank}
                    width={24}
                    height={24}
                    className="shrink-0"
                  />
                )}
                {currentGhost.username}
              </button>
            ) : (
              <span className="text-xs text-muted-foreground">No ghost</span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
              title="Next ghost"
              onClick={navigateNextGhost}
              disabled={isAtLastGhost}
            >
              <ArrowRight className="size-3.5" />
            </Button>
          </div>

          {/* Right: controls */}
          <div className="flex items-center justify-end gap-0.5">
            {/* Play / Pause */}
            {isReady && playback?.player.platform === "twitch" && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground"
                title={isPaused ? "Play" : "Pause"}
                onClick={togglePlay}
              >
                {isPaused ? (
                  <Play className="size-3" />
                ) : (
                  <Pause className="size-3" />
                )}
              </Button>
            )}

            {/* Mute / Unmute */}
            {isReady && playback?.player.platform === "twitch" && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground"
                title={isMuted ? "Unmute" : "Mute"}
                onClick={toggleMute}
              >
                {isMuted ? (
                  <VolumeX className="size-3" />
                ) : (
                  <Volume2 className="size-3" />
                )}
              </Button>
            )}

            {currentGhost?.matchup_id && (
              <BookmarkButton matchupId={currentGhost.matchup_id} size="icon-sm" className="size-7" />
            )}

            {/* Copy shareable link */}
            {videoId && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground"
                title="Copy shareable link"
                onClick={() => {
                  // Build a shareable link: /:streamer/:vodId/:ghost or /:streamer/:vodId
                  const ghost = currentGhost;
                  if (ghost && meta?.streamerName) {
                    const url = `${window.location.origin}/${encodeURIComponent(meta.streamerName)}/${videoId}/${encodeURIComponent(ghost.username)}`;
                    navigator.clipboard.writeText(url);
                  } else if (meta?.streamerName) {
                    const url = `${window.location.origin}/${encodeURIComponent(meta.streamerName)}/${videoId}`;
                    navigator.clipboard.writeText(url);
                  } else {
                    // No streamer metadata available — fall back to Twitch link
                    const t = secondsToTwitchTimestamp(timestamp ?? 0);
                    const url = playback?.player.platform === "twitch" ? `https://www.twitch.tv/videos/${playback.player.sourceId}?t=${t}` : playback?.player.watchUrl ?? "";
                    navigator.clipboard.writeText(url);
                  }
                }}
              >
                <Copy className="size-3" />
              </Button>
            )}

            {/* Close */}
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground"
              title="Close player"
              onClick={hideEmbed}
            >
              <X className="size-3" />
            </Button>
          </div>
        </div>

        {/* Timeline — always visible */}
        {isReady && playback?.player.platform === "twitch" && duration > 0 && (
          <>
            <div className="flex items-center justify-between px-3 pt-2 pb-1 text-xs text-muted-foreground">
              <span className="truncate">
                {meta?.vodTitle ?? `Video ${videoId}`}
                {meta?.date && <span className="ml-1.5">{meta.date}</span>}
              </span>
              <span className="shrink-0 ml-2 tabular-nums">
                {sortedGhosts.length} ghost{sortedGhosts.length !== 1 && "s"}
                {" · "}
                {formatTimestamp(duration)}
              </span>
            </div>
            <div className="px-3 py-3">
              <EmbedTimeline
                currentTime={currentTime}
                duration={duration}
                bazaarChapters={bazaarChapters}
                ghosts={sortedGhosts}
                currentGhostId={currentGhost?.detection_id ?? null}
                onSeekGhost={seekToGhost}
              />
            </div>
          </>
        )}

        {/* Contextual explore pills — quick filters for related results */}
        {(currentGhost || meta) && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-border px-3 py-2">
            <span className="mr-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
              See more
            </span>
            {currentGhost && (
              <button
                onClick={() =>
                  router.push(
                    `/search?q=${encodeURIComponent(currentGhost.username)}`,
                    { scroll: false }
                  )
                }
                className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                <Ghost className="size-2.5" />
                <span className="font-medium text-foreground">
                  {currentGhost.username}
                </span>
              </button>
            )}
            {meta?.streamerName && (
              <button
                onClick={() =>
                  router.push(
                    `/search?streamer=${encodeURIComponent(meta.streamerName)}`,
                    { scroll: false }
                  )
                }
                className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                <User className="size-2.5" />
                <span className="font-medium text-foreground">
                  {meta.streamerName}
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
