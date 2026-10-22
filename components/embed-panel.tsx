"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Ghost } from "lucide-react";
import { useEmbedActions, useEmbedState, useEmbedTime } from "@/components/embed-provider";
import { PlayerSlot } from "@/components/player/player-slot";
import { PlayerControls } from "@/components/player/player-controls";
import { EmbedTimeline } from "@/components/embed-timeline";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { SplitHandle } from "@/components/split-handle";
import { useStoredSplit } from "@/hooks/use-stored-split";
import { useSplitBounds } from "@/hooks/use-split-bounds";
import { cn } from "@/lib/utils";

/** Persistent video chrome above a retained nested companion; closing video frees its full context area. */
export function EmbedPanel({ children }: { children?: ReactNode }) {
  const { isVisible, videoId, reserved, isReady, ghosts, selectedGhost, bazaarChapters, capabilities } = useEmbedState();
  const { goToGhost } = useEmbedActions();
  const duration = useEmbedTime((s) => s.duration);
  const split = useStoredSplit("video-context", 0.58);
  const group = useRef<HTMLDivElement>(null);
  const [compactOpen, setCompactOpen] = useState(false);
  const showVideo = (isVisible && !!videoId) || reserved;
  const ratio = useSplitBounds(group, "y", split.ratio, 180, 150, showVideo && !!children);
  const [previousVideo, setPreviousVideo] = useState(showVideo);
  if (previousVideo !== showVideo) {
    setPreviousVideo(showVideo);
    if (!showVideo) setCompactOpen(true);
  }
  if (!showVideo && !children) return <Empty className="max-md:hidden md:m-2"><EmptyHeader><EmptyMedia><Ghost aria-hidden className="size-10 text-muted-foreground" /></EmptyMedia><EmptyTitle>Find a matchup to watch</EmptyTitle><EmptyDescription>Your search stays here while you explore its session.</EmptyDescription></EmptyHeader></Empty>;
  return <div style={{ "--video-flex": children ? `${ratio} 1 0%` : "1 1 0%", "--context-flex": `${1 - ratio} 1 0%` } as CSSProperties} className={cn("@container mx-auto flex w-full min-w-0 flex-col overflow-hidden bg-card md:m-2 md:h-[calc(100%-1rem)] md:max-h-none md:w-auto md:flex-1 md:rounded-lg md:border md:border-border", !showVideo && "max-md:h-[60svh]", !showVideo && !compactOpen && "max-md:h-auto")}>
    <div ref={group} className="flex min-h-0 flex-1 flex-col">
      {showVideo && <>
        <div className={cn("flex min-h-0 flex-[var(--video-flex)] flex-col overflow-hidden max-md:flex-none", ratio === 0 && children && "md:invisible")}>
          <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black max-md:aspect-video max-md:flex-none"><PlayerSlot className="h-full w-full" /></div>
          <div className="shrink-0"><PlayerControls />
            {capabilities?.timeEvents !== false && <div className="h-12 border-t border-border px-3 py-2.5">
              {isReady && duration > 0 ? <EmbedTimeline duration={duration} bazaarChapters={bazaarChapters} ghosts={ghosts} currentGhostId={selectedGhost?.detection_id ?? null} onSeekGhost={goToGhost} /> : <Skeleton className="h-7 w-full" />}
            </div>}
          </div>
        </div>
        {children && <SplitHandle axis="y" label="Resize video and session context" ratio={ratio} onChange={split.change} onCommit={split.commit} onRestore={split.restore} before={180} after={150} className="hidden md:flex" />}
      </>}
      {children && <div className={cn("flex min-h-0 flex-col", showVideo ? "flex-[var(--context-flex)] max-md:h-[30svh] max-md:flex-none" : "flex-1", !compactOpen && "max-md:h-auto max-md:flex-none", showVideo && ratio === 1 && "md:invisible")}>
        <Button variant="ghost" size="sm" className="shrink-0 md:hidden" aria-expanded={compactOpen} onClick={() => setCompactOpen((v) => !v)}>Session context {compactOpen ? <ChevronUp data-icon="inline-end" /> : <ChevronDown data-icon="inline-end" />}</Button>
        <div className={cn("flex min-h-0 flex-1 flex-col", !compactOpen && "max-md:hidden")}>{children}</div>
      </div>}
    </div>
  </div>;
}
