"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Ghost } from "lucide-react";
import {
  useEmbedActions,
  useEmbedState,
  useEmbedTime,
} from "@/components/embed-provider";
import { PlayerSlot } from "@/components/player/player-slot";
import { PlayerControls } from "@/components/player/player-controls";
import { EmbedTimeline } from "@/components/embed-timeline";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useResizableSplit } from "@/hooks/use-resizable-split";
import { cn } from "@/lib/utils";

/** Persistent video chrome above a retained nested companion; closing video frees its full context area. */
export function EmbedPanel({ children }: { children?: ReactNode }) {
  const {
    isVisible,
    videoId,
    reserved,
    isReady,
    ghosts,
    selectedGhost,
    bazaarChapters,
    capabilities,
  } = useEmbedState();
  const { goToGhost } = useEmbedActions();
  const duration = useEmbedTime((s) => s.duration);
  const [compactOpen, setCompactOpen] = useState(false);
  const showVideo = (isVisible && !!videoId) || reserved;
  const split = useResizableSplit(
    "video-context",
    0.58,
    "video",
    "context",
    showVideo && !!children
  );
  const [previousVideo, setPreviousVideo] = useState(showVideo);
  if (previousVideo !== showVideo) {
    setPreviousVideo(showVideo);
    if (!showVideo) setCompactOpen(true);
  }
  if (!showVideo && !children)
    return (
      <Empty className="max-md:hidden md:m-2">
        <EmptyHeader>
          <EmptyMedia>
            <Ghost aria-hidden className="size-10 text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle>Find a matchup to watch</EmptyTitle>
          <EmptyDescription>
            Your search stays here while you explore its session.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  return (
    <div
      className={cn(
        "@container flex w-full min-w-0 flex-col overflow-hidden bg-card md:min-h-0 md:flex-1",
        !showVideo && "max-md:h-[60svh]",
        !showVideo && !compactOpen && "max-md:h-auto"
      )}
    >
      <ResizablePanelGroup
        id="video-context"
        orientation="vertical"
        groupRef={split.groupRef}
        disabled={split.compact}
        onLayoutChange={split.onLayoutChange}
        onLayoutChanged={split.onLayoutChanged}
        className="min-h-0 flex-1 max-md:h-auto! max-md:overflow-visible! max-md:[&>[data-panel]]:flex-none! max-md:[&>[data-panel]]:max-h-none!"
      >
        {showVideo && (
          <>
            <ResizablePanel
              id="video"
              defaultSize={children ? "58%" : "100%"}
              minSize={180}
              collapsible
              inert={split.leadingCollapsed}
              className={cn(
                "flex min-h-0 w-full flex-col overflow-hidden",
                split.leadingCollapsed && "invisible"
              )}
            >
              <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black max-md:aspect-video max-md:flex-none">
                <PlayerSlot className="h-full w-full" />
              </div>
              <div className="shrink-0">
                <PlayerControls />
                {capabilities?.timeEvents !== false && (
                  <div className="h-10 border-t border-border px-3 py-1.5">
                    {isReady && duration > 0 ? (
                      <EmbedTimeline
                        duration={duration}
                        bazaarChapters={bazaarChapters}
                        ghosts={ghosts}
                        currentGhostId={selectedGhost?.detection_id ?? null}
                        onSeekGhost={goToGhost}
                      />
                    ) : (
                      <Skeleton className="h-7 w-full" />
                    )}
                  </div>
                )}
              </div>
            </ResizablePanel>
            {/* Extend its measured hit region across the column gutter so the T-junction drags both groups. */}
            {children && (
              <ResizableHandle
                withHandle
                aria-label="Resize video and session context"
                disableDoubleClick
                onDoubleClick={split.restore}
                onKeyDownCapture={split.restoreOnEnter}
                className="hidden aria-[orientation=horizontal]:-ml-2 aria-[orientation=horizontal]:h-2 aria-[orientation=horizontal]:w-[calc(100%+0.5rem)] md:flex"
              />
            )}
          </>
        )}
        {children && (
          <ResizablePanel
            id="context"
            minSize={150}
            collapsible
            inert={split.trailingCollapsed}
            className={cn(
              "flex min-h-0 w-full flex-col",
              split.trailingCollapsed && "invisible",
              showVideo && "max-md:h-[30svh]",
              !compactOpen && "max-md:h-auto"
            )}
          >
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 md:hidden"
              aria-expanded={compactOpen}
              onClick={() => setCompactOpen((v) => !v)}
            >
              Session context{" "}
              {compactOpen ? (
                <ChevronUp data-icon="inline-end" />
              ) : (
                <ChevronDown data-icon="inline-end" />
              )}
            </Button>
            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col",
                !compactOpen && "max-md:hidden"
              )}
            >
              {children}
            </div>
          </ResizablePanel>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
