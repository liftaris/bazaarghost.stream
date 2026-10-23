"use client";

import { type ReactNode } from "react";
import { Ghost } from "lucide-react";
import {
  useEmbedActions,
  useEmbedState,
  useEmbedTime,
} from "@/components/embed-provider";
import { PlayerSlot } from "@/components/player/player-slot";
import { PlayerControls } from "@/components/player/player-controls";
import { EmbedTimeline } from "@/components/embed-timeline";
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
export function EmbedPanel({
  children,
  mobileNavigation,
  mobileTab = "details",
}: {
  children?: ReactNode;
  mobileNavigation?: ReactNode;
  mobileTab?: string;
}) {
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
  const showVideo = (isVisible && !!videoId) || reserved;
  const split = useResizableSplit(
    "video-context",
    0.58,
    "video",
    "context",
    showVideo && !!children
  );
  if (!showVideo && !children)
    return (
      <>
        {mobileNavigation}
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
      </>
    );
  return (
    <div className="@container flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-card">
      <ResizablePanelGroup
        id="video-context"
        data-mobile-tab={mobileTab}
        orientation="vertical"
        groupRef={split.groupRef}
        disabled={split.compact}
        onLayoutChange={split.onLayoutChange}
        onLayoutChanged={split.onLayoutChanged}
        className="min-h-0 flex-1 max-md:[&>[data-panel]]:max-h-none! max-md:[&>#video]:flex-none! max-md:[&>#context]:min-h-0! max-md:[&>#context]:flex-1! max-md:data-[mobile-tab=results]:[&>#context]:hidden!"
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
              <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black max-md:aspect-video max-md:max-h-[40svh] max-md:flex-none">
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
        {mobileNavigation}
        {children && (
          <ResizablePanel
            id="context"
            minSize={150}
            collapsible
            inert={split.trailingCollapsed}
            className={cn(
              "flex min-h-0 w-full flex-col",
              split.trailingCollapsed && "invisible"
            )}
          >
            {children}
          </ResizablePanel>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
