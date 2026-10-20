"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
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
import { EmbedTimeline } from "@/components/embed-timeline";
import { PlayerSlot } from "@/components/player/player-slot";
import { BookmarkButton } from "@/components/social/bookmark-button";
import { Kbd } from "@/components/ui/kbd";
import { PLAYER_SHORTCUTS, type PlayerShortcutAction } from "@/lib/player-shortcuts";
import { cn } from "@/lib/utils";

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
  shortcut,
  className,
  children,
  ...props
}: { label: string; shortcut?: PlayerShortcutAction } & React.ComponentProps<typeof Button>) {
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
      <TooltipContent>
        {label}
        {shortcut && <Kbd>{PLAYER_SHORTCUTS[shortcut].keys[0]}</Kbd>}
      </TooltipContent>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// EmbedPanel
// ---------------------------------------------------------------------------

export function EmbedPanel() {
  const {
    videoId,
    playback,
    meta,
    isVisible,
    isReady,
    ghosts: sortedGhosts,
    activeGhost: currentGhost,
    ghostIsOptimistic,
    bazaarChapters,
    capabilities,
  } = useEmbedState();
  const { hideEmbed, seek, goToGhost } = useEmbedActions();
  const duration = useEmbedTime((s) => s.duration);
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  /** Canonical URL path: `/matchups/:id` for a ghost, else `/videos/:id`. */
  const buildGhostUrl = useCallback(
    (ghost: EmbedGhost | null) => {
      if (!videoId) return null;
      return ghost?.matchup_id ? `/matchups/${ghost.matchup_id}` : `/videos/${videoId.slice(2)}`;
    },
    [videoId]
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

  const navigatePrevGhost = useCallback(() => goToGhost("prev"), [goToGhost]);
  const navigateNextGhost = useCallback(() => goToGhost("next"), [goToGhost]);

  const copyLink = useCallback(() => {
    if (!videoId) return;
    const path = buildGhostUrl(currentGhost);
    if (path) navigator.clipboard.writeText(`${window.location.origin}${path}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }, [videoId, buildGhostUrl, currentGhost]);

  const showChrome = isVisible && !!videoId;
  const when = meta?.date ? relativeDate(meta.date) : null;
  const rank = currentGhost?.rank?.toLowerCase();
  const showTimeline = !capabilities || capabilities.timeEvents;

  // Nothing selected: a still empty state, not loading placeholders. Desktop only;
  // on mobile the results take the whole screen.
  if (!showChrome) {
    return (
      <Empty className="max-md:hidden md:m-2 md:border md:border-border">
        <EmptyHeader>
          <EmptyMedia>
            <Ghost aria-hidden className="size-16 text-muted-foreground/25" strokeWidth={1.25} />
          </EmptyMedia>
          <EmptyTitle className="sr-only">No matchup selected</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden border-border bg-card md:m-2 md:rounded-lg md:border"
      )}
    >
      {/* The persistent PlayerHost is positioned over this slot */}
      <div className="relative">
        <PlayerSlot />
        {playback && playback.processing.remainingRanges.length > 0 && (
          <p className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-card/80 px-3 py-1 text-xs text-muted-foreground">Processing is incomplete. More matchups may appear as the remaining sections finish.</p>
        )}
      </div>

      {/* One control row: prev · ghost · next | save · search · copy · close */}
      <div className="flex h-12 items-center gap-0.5 border-t border-border px-2">
        <IconButton label="Previous ghost" shortcut="prevGhost" onClick={navigatePrevGhost} disabled={isAtFirstGhost}>
          <ChevronLeft />
        </IconButton>
        <button
          type="button"
          disabled={!currentGhost}
          onClick={() => currentGhost && seek(currentGhost.frame_time_seconds)}
          className="flex h-8 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md px-1 text-sm font-medium text-foreground transition-colors enabled:cursor-pointer enabled:hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {currentGhost ? (
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
        <IconButton label="Next ghost" shortcut="nextGhost" onClick={navigateNextGhost} disabled={isAtLastGhost}>
          <ChevronRight />
        </IconButton>

        <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-5" />

        {currentGhost?.matchup_id ? (
          <BookmarkButton matchupId={currentGhost.matchup_id} tooltip />
        ) : null}
        {currentGhost && (
          <IconButton
            label="Search ghost"
            className="hidden sm:inline-flex"
            onClick={() => router.push(`/search?q=${encodeURIComponent(currentGhost.username)}`, { scroll: false })}
          >
            <Search />
          </IconButton>
        )}
        <IconButton label={copied ? "Copied" : "Copy link"} onClick={copyLink}>
          {copied ? <Check /> : <Copy />}
        </IconButton>
        <IconButton label="Close player" shortcut="close" onClick={hideEmbed}>
          <X />
        </IconButton>
      </div>

      {/* Stream info — fixed height so late data doesn't shift layout */}
      <div className="flex h-8 items-center gap-2 border-t border-border px-3 text-xs text-muted-foreground">
        {meta ? (
          <>
            <Badge variant="outline" asChild className="min-w-0 max-w-[40%] cursor-pointer text-foreground has-disabled:cursor-default">
              <button
                type="button"
                disabled={!meta.streamerId}
                onClick={() =>
                  router.push(`/search?streamer=${meta.streamerId}`, { scroll: false })
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
      {showTimeline && (
        <div className="h-[52px] border-t border-border px-3 py-3">
          {isReady && duration > 0 ? (
            <EmbedTimeline
              duration={duration}
              bazaarChapters={bazaarChapters}
              ghosts={sortedGhosts}
              currentGhostId={currentGhost?.detection_id ?? null}
              onSeekGhost={goToGhost}
            />
          ) : (
            <Skeleton className="h-full w-full bg-muted" />
          )}
        </div>
      )}
    </div>
  );
}
