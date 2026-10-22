"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useEmbedTime, type EmbedGhost } from "@/components/embed-provider";
import { cn } from "@/lib/utils";
import { opponentLabel } from "@/lib/opponent-name";
import { clock } from "@/lib/session-navigation";

const KNOWN_RANKS = new Set(["bronze", "silver", "gold", "diamond", "legend"]);
/** Pointer within this many px of a tick counts as hovering it. */
const HOVER_SNAP_PX = 12;

/** Index of the time in `times` (sorted ascending) closest to `t`. */
function nearestIndex(times: number[], t: number): number {
  let lo = 0;
  let hi = times.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (times[mid] < t) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0 && Math.abs(times[lo - 1] - t) <= Math.abs(times[lo] - t)) return lo - 1;
  return lo;
}

interface TickProps {
  ghost: EmbedGhost;
  left: number;
  isCurrent: boolean;
  isTabStop: boolean;
  isOpen: boolean;
  onSeek: (ghost: EmbedGhost) => void;
  onFocusTick: (index: number) => void;
  onBlurTick: () => void;
  index: number;
  register: (index: number, el: HTMLButtonElement | null) => void;
}

/**
 * One ghost marker: a 24px-wide hit area around a 2px (4px when current) tick.
 * Pointer input is handled by the track (nearest tick); the button exists for
 * keyboard focus, the screen-reader name and the tooltip.
 */
const Tick = memo(function Tick({
  ghost, left, isCurrent, isTabStop, isOpen, onSeek, onFocusTick, onBlurTick, index, register,
}: TickProps) {
  const rank = ghost.rank?.toLowerCase();
  return (
    <Tooltip open={isOpen}>
      <TooltipTrigger asChild>
        <button
          ref={(el) => register(index, el)}
          type="button"
          tabIndex={isTabStop ? 0 : -1}
          aria-label={`${opponentLabel(ghost)}, ${clock(ghost.frame_time_seconds)}`}
          aria-current={isCurrent ? "true" : undefined}
          onClick={(e) => { e.stopPropagation(); onSeek(ghost); }}
          onFocus={() => onFocusTick(index)}
          onBlur={onBlurTick}
          className="group/tick pointer-events-none absolute top-0 h-full w-6 -translate-x-1/2 outline-none"
          style={{ left: `${left}%` }}
        >
          <span
            className={cn(
              "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[height,background-color] duration-150 group-focus-visible/tick:ring-2 group-focus-visible/tick:ring-ring motion-reduce:transition-none",
              isCurrent
                ? "h-4 w-1.5 bg-primary group-hover/timeline:h-5"
                : cn("h-3 w-0.5 group-hover/timeline:h-4", isOpen ? "bg-foreground" : "bg-foreground/35")
            )}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6} className="flex items-center gap-1.5 text-xs">
        {rank && KNOWN_RANKS.has(rank) && (
          <Image src={`/${rank}.webp`} alt="" width={16} height={16} unoptimized />
        )}
        {opponentLabel(ghost)}
        <span className="tabular-nums">{clock(ghost.frame_time_seconds)}</span>
      </TooltipContent>
    </Tooltip>
  );
});

/** The only part that follows playback time: a transform on a full-width layer. */
function Playhead({ duration }: { duration: number }) {
  const pct = useEmbedTime((s) => (duration > 0 ? Math.min(100, (s.currentTime / duration) * 100) : 0));
  return (
    <div className="pointer-events-none absolute inset-0 overflow-x-clip" aria-hidden>
      <div className="absolute inset-y-0 left-0 w-full" style={{ transform: `translateX(${pct}%)` }}>
        <div className="absolute left-0 top-1/2 h-6 w-px -translate-x-1/2 -translate-y-1/2 bg-foreground" />
      </div>
    </div>
  );
}

interface EmbedTimelineProps {
  duration: number;
  bazaarChapters: number[] | null;
  ghosts: EmbedGhost[];
  currentGhostId: string | null;
  onSeekGhost: (ghost: EmbedGhost) => void;
}

export function EmbedTimeline({
  duration,
  bazaarChapters,
  ghosts,
  currentGhostId,
  onSeekGhost,
}: EmbedTimelineProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const ticks = useRef<(HTMLButtonElement | null)[]>([]);
  const frame = useRef(0);
  const pointerX = useRef<number | null>(null);
  const dragging = useRef(false);
  const [hover, setHover] = useState<number | null>(null);
  const [focus, setFocus] = useState<number | null>(null);

  const times = useMemo(() => ghosts.map((g) => g.frame_time_seconds), [ghosts]);
  const currentIndex = useMemo(
    () => ghosts.findIndex((g) => g.detection_id === currentGhostId),
    [ghosts, currentGhostId]
  );
  const active = hover ?? focus;
  const tabStop = focus ?? (currentIndex >= 0 ? currentIndex : 0);

  const chapters = useMemo(() => {
    const out: { left: number; width: number }[] = [];
    if (bazaarChapters && duration > 0) {
      for (let i = 0; i < bazaarChapters.length - 1; i += 2) {
        out.push({
          left: (bazaarChapters[i] / duration) * 100,
          width: ((bazaarChapters[i + 1] - bazaarChapters[i]) / duration) * 100,
        });
      }
    }
    return out;
  }, [bazaarChapters, duration]);

  // Pointer work runs at most once per frame and writes the cursor straight to the DOM.
  const flush = useCallback(() => {
    frame.current = 0;
    const root = rootRef.current;
    const cursor = cursorRef.current;
    const x = pointerX.current;
    if (!root || !cursor) return;
    if (x === null) {
      cursor.style.opacity = "0";
      setHover(null);
      return;
    }
    const rect = root.getBoundingClientRect();
    const px = Math.min(Math.max(x - rect.left, 0), rect.width);
    cursor.style.opacity = "1";
    cursor.style.transform = `translateX(${px}px)`;
    if (times.length === 0 || rect.width <= 0) return;
    const i = nearestIndex(times, (px / rect.width) * duration);
    const tickPx = (times[i] / duration) * rect.width;
    setHover(Math.abs(tickPx - px) <= HOVER_SNAP_PX ? i : null);
  }, [times, duration]);

  const schedule = useCallback(() => {
    if (!frame.current) frame.current = requestAnimationFrame(flush);
  }, [flush]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    pointerX.current = e.clientX;
    schedule();
  };
  const onPointerLeave = () => {
    pointerX.current = null;
    schedule();
  };

  const commitPointer = (e: PointerEvent<HTMLDivElement>) => {
    const root = rootRef.current;
    if (!root || times.length === 0 || !dragging.current) return;
    dragging.current = false;
    const rect = root.getBoundingClientRect();
    onSeekGhost(ghosts[nearestIndex(times, ((e.clientX - rect.left) / rect.width) * duration)]);
    e.currentTarget.releasePointerCapture(e.pointerId);
    pointerX.current = null;
    schedule();
  };

  const register = useCallback((i: number, el: HTMLButtonElement | null) => {
    ticks.current[i] = el;
  }, []);
  const onFocusTick = useCallback((i: number) => setFocus(i), []);
  const onBlurTick = useCallback(() => setFocus(null), []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const from = focus ?? tabStop;
    const to =
      e.key === "ArrowRight" ? from + 1
      : e.key === "ArrowLeft" ? from - 1
      : e.key === "Home" ? 0
      : e.key === "End" ? ghosts.length - 1
      : null;
    if (to === null) return;
    e.preventDefault();
    ticks.current[Math.min(Math.max(to, 0), ghosts.length - 1)]?.focus();
  };

  return (
    // Pointer handling is delegated here; keyboard access is provided by the focusable ticks
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      ref={rootRef}
      data-timeline
      role="group"
      aria-label="Ghosts"
      onPointerMove={onPointerMove}
      onPointerDown={(e) => { if (e.button !== 0) return; dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); onPointerMove(e); }}
      onPointerUp={commitPointer}
      onPointerLeave={() => { if (!dragging.current) onPointerLeave(); }}
      onPointerCancel={() => { dragging.current = false; onPointerLeave(); }}
      onLostPointerCapture={() => { dragging.current = false; onPointerLeave(); }}
      onKeyDown={onKeyDown}
      className="group/timeline relative h-7 w-full cursor-pointer touch-none"
    >
      {/* Static layer: track + chapters (only changes with the VOD) */}
      <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-muted transition-[height] duration-150 group-hover/timeline:h-3 motion-reduce:transition-none">
        {chapters.map((c, i) => (
          <div
            key={i}
            className="absolute inset-y-0 bg-primary/30"
            style={{ left: `${c.left}%`, width: `max(${c.width}%, 2px)` }}
          />
        ))}
      </div>

      {/* Ghost ticks (change with the current ghost / hover / focus) */}
      {duration > 0 &&
        ghosts.map((ghost, i) => (
          <Tick
            key={ghost.detection_id}
            ghost={ghost}
            index={i}
            left={(ghost.frame_time_seconds / duration) * 100}
            isCurrent={i === currentIndex}
            isTabStop={i === tabStop}
            isOpen={i === active}
            onSeek={onSeekGhost}
            onFocusTick={onFocusTick}
            onBlurTick={onBlurTick}
            register={register}
          />
        ))}

      {/* Hover cursor: transform written by rAF, no React state */}
      <div
        ref={cursorRef}
        aria-hidden
        className="pointer-events-none absolute inset-y-1 left-0 w-px bg-foreground/40 opacity-0 transition-opacity motion-reduce:transition-none"
      />

      <Playhead duration={duration} />
    </div>
  );
}
