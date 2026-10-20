"use client";

import { memo, useRef } from "react";
import { Ghost, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SourceStack } from "@/components/source-stack";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface SessionCardData {
  id: number;
  title: string;
  streamer: { id: number; displayName: string; avatarUrl: string | null } | null;
  channel: { displayName: string; avatarUrl: string | null };
  startedAt: string | null;
  durationSeconds: number | null;
  matchupCount: number;
  platforms: string[];
  defaultRecording: { id: number; platform: string };
}

interface RecordingResultRowProps {
  session: SessionCardData;
  selected?: boolean;
  /** Currently playing. */
  active?: boolean;
  onSelect(): void;
  onPrefetch?(): void;
}

function formatDuration(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${String(m).padStart(2, "0")}:${ss}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const MARQUEE_PX_PER_SECOND = 40;

export const RecordingResultRow = memo(function RecordingResultRow({
  session,
  selected,
  active,
  onSelect,
  onPrefetch,
}: RecordingResultRowProps) {
  const boxRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const owner = session.streamer ?? session.channel;
  const highlighted = selected || active;
  const hasDuration = session.durationSeconds != null;
  const hasDate = !!session.startedAt;
  const marks = session.platforms.map((platform) => ({ platform }));

  // Measured on enter/focus only, written straight to the DOM: no state, no re-render.
  const measure = () => {
    const box = boxRef.current;
    const text = textRef.current;
    if (!box || !text) return;
    const overflow = Math.ceil(text.scrollWidth - box.clientWidth);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (overflow > 0 && !reduced) {
      text.style.setProperty("--marquee-distance", `${-overflow}px`);
      text.style.setProperty("--marquee-duration", `${(overflow / MARQUEE_PX_PER_SECOND + 0.6).toFixed(2)}s`);
      text.dataset.overflow = "";
    } else {
      delete text.dataset.overflow;
    }
    if (overflow > 0 && reduced) box.title = session.title;
    else box.removeAttribute("title");
  };

  return (
    <div
      onPointerEnter={() => {
        measure();
        onPrefetch?.();
      }}
      onFocus={() => {
        measure();
        onPrefetch?.();
      }}
      className={cn(
        "recording-row @container relative box-border h-[72px] overflow-hidden rounded-lg border transition-colors focus-within:ring-2 focus-within:ring-ring",
        highlighted ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
      )}
    >
      <div className="flex h-full items-center gap-3 px-3">
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="relative z-10 flex shrink-0">
                  <Avatar className="size-5">
                    {owner.avatarUrl && <AvatarImage src={owner.avatarUrl} alt="" />}
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      <User aria-hidden className="size-3" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="sr-only">{owner.displayName}</span>
                </span>
              </TooltipTrigger>
              <TooltipContent>{owner.displayName}</TooltipContent>
            </Tooltip>
            <button
              type="button"
              onClick={onSelect}
              aria-current={active ? "true" : undefined}
              className="min-w-0 flex-1 text-left font-medium text-foreground outline-none after:absolute after:inset-0"
            >
              <span ref={boxRef} className="block overflow-hidden whitespace-nowrap">
                <span ref={textRef} className="marquee-title inline-block">
                  {session.title}
                </span>
              </span>
            </button>
          </div>
          <div className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-xs tabular-nums text-muted-foreground">
            {hasDuration && <span className="hidden @[200px]:inline">{formatDuration(session.durationSeconds!)}</span>}
            {hasDate && (
              <span className={cn("hidden @[260px]:inline", hasDuration && "before:mr-1.5 before:content-['·']")}>
                {formatDate(session.startedAt!)}
              </span>
            )}
            {session.matchupCount > 0 && (
              <span
                className={cn(
                  "flex items-center gap-0.5",
                  hasDuration
                    ? "@[200px]:before:mr-1 @[200px]:before:content-['·']"
                    : hasDate && "@[260px]:before:mr-1 @[260px]:before:content-['·']"
                )}
                title={`${session.matchupCount} ghosts`}
              >
                <Ghost aria-hidden className="size-3" />
                <span className="sr-only">Ghosts: </span>
                {session.matchupCount}
              </span>
            )}
          </div>
        </div>
        <SourceStack sources={marks} className="hidden @[280px]:flex" />
        <SourceStack sources={marks.slice(0, 1)} className="hidden @[200px]:flex @[280px]:hidden" />
      </div>
    </div>
  );
});

export function RecordingResultRowSkeleton() {
  return (
    <div className="box-border flex h-[72px] items-center gap-3 rounded-lg border border-border bg-card px-3">
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-4 w-8" />
    </div>
  );
}
