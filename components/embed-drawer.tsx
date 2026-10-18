"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ChevronUp, Pause, Play } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEmbed } from "@/components/embed-provider";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

/**
 * Embed region: a bottom sheet below `md`, the static right-hand pane at `md`
 * and up. It is always rendered (closed = transform + inert) and only hosts the
 * PlayerSlot; the persistent PlayerHost follows the slot, so the iframe is
 * never destroyed on open/close or when crossing the breakpoint.
 *
 * `headerHeight` is the measured height of the search header so the sheet
 * stops just below it, keeping the search bar interactive while watching.
 */

interface EmbedDrawerProps {
  /** Pixel height of the search header bar. The sheet will not cover it. */
  headerHeight?: number;
  children: ReactNode;
}

export function EmbedDrawer({ headerHeight = 0, children }: EmbedDrawerProps) {
  const {
    isVisible,
    videoId,
    timestamp,
    meta,
    isPaused,
    pause,
    play,
    togglePlay,
    activeGhost,
  } = useEmbed();
  const [sheetOpen, setSheetOpen] = useState(false);
  const isMobile = useIsMobile();

  const currentGhostName = activeGhost?.username ?? null;

  // Open the sheet when a new ghost/vod is selected.
  // Close when explicitly dismissed via the X button.
  const prevVideoId = useRef(videoId);
  const prevTimestamp = useRef(timestamp);
  useEffect(() => {
    if (!isVisible) {
      setSheetOpen(false);
    } else if (
      videoId !== prevVideoId.current ||
      timestamp !== prevTimestamp.current
    ) {
      setSheetOpen(true);
    }
    prevVideoId.current = videoId;
    prevTimestamp.current = timestamp;
  }, [isVisible, videoId, timestamp]);

  const handleClose = useCallback(() => {
    pause();
    setSheetOpen(false);
  }, [pause]);

  const handleReopen = useCallback(() => {
    setSheetOpen(true);
    play();
  }, [play]);

  return (
    <>
      {/* Persistent bottom bar — visible when sheet is closed */}
      {isVisible && !!videoId && !sheetOpen && (
        <button
          type="button"
          onClick={handleReopen}
          className="fixed inset-x-0 bottom-0 z-40 flex cursor-pointer items-center gap-3 border-t border-border bg-card px-4 py-3 text-left md:hidden"
        >
          <span
            role="button"
            aria-pressed={!isPaused}
            aria-label={isPaused ? "Play" : "Pause"}
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                togglePlay();
              }
            }}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            {isPaused ? (
              <Play className="size-4" />
            ) : (
              <Pause className="size-4" />
            )}
          </span>
          {meta?.streamerAvatar && (
            <Avatar className="size-7 shrink-0">
              <AvatarImage src={meta.streamerAvatar} alt={meta.streamerName} />
              <AvatarFallback className="bg-primary text-[9px] text-primary-foreground">
                {meta.streamerName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {meta?.streamerName ?? `Video ${videoId}`}
              {currentGhostName && (
                <span className="text-muted-foreground">
                  {" "}
                  vs <span className="text-foreground">{currentGhostName}</span>
                </span>
              )}
            </p>
            {meta?.vodTitle && (
              <p className="truncate text-xs text-muted-foreground">
                {meta.vodTitle}
              </p>
            )}
          </div>
          <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
        </button>
      )}

      {/* Scrim overlay — starts below the search header so it stays interactive */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden",
          sheetOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        )}
        style={{ top: headerHeight }}
        onClick={handleClose}
      />

      {/* Bottom sheet — slides up to just below the search header */}
      <div
        inert={isMobile && !sheetOpen}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 flex max-h-[calc(100svh-var(--sheet-top))] flex-col rounded-t-2xl border-t border-border bg-card transition-transform duration-300 ease-out",
          "md:static md:z-auto md:max-h-none md:min-h-0 md:min-w-0 md:flex-1 md:translate-y-0 md:rounded-none md:border-t-0 md:bg-background md:transition-none",
          sheetOpen ? "translate-y-0" : "translate-y-full"
        )}
        style={{ "--sheet-top": `${headerHeight}px` } as CSSProperties}
      >
        {/* Drag handle */}
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div className="flex w-full justify-center py-2 md:hidden" onClick={handleClose}>
          <div className="h-1.5 w-10 rounded-full bg-muted" />
        </div>

        {/* Embed content — always in DOM */}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  );
}
