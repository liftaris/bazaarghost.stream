"use client";

import { memo } from "react";
import { Ghost, User, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SourceStack } from "@/components/source-stack";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface StreamerCardData {
  id: number;
  displayName: string;
  avatarUrl: string | null;
  sessionCount: number;
  matchupCount: number;
  platforms: string[];
}

interface StreamerResultRowProps {
  streamer: StreamerCardData;
  selected?: boolean;
  onSelect(): void;
  onPrefetch?(): void;
}

export const StreamerResultRow = memo(function StreamerResultRow({
  streamer,
  selected,
  onSelect,
  onPrefetch,
}: StreamerResultRowProps) {
  return (
    <div
      onPointerEnter={onPrefetch}
      onFocus={onPrefetch}
      className={cn(
        "@container relative box-border h-[72px] overflow-hidden rounded-lg border transition-colors focus-within:ring-2 focus-within:ring-ring",
        selected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
      )}
    >
      <div className="flex h-full items-center gap-3 px-3">
        <Avatar className="hidden size-9 shrink-0 @[150px]:flex">
          {streamer.avatarUrl && <AvatarImage src={streamer.avatarUrl} alt="" />}
          <AvatarFallback className="bg-muted text-muted-foreground">
            <User aria-hidden className="size-4" />
          </AvatarFallback>
        </Avatar>

        <button
          type="button"
          onClick={onSelect}
          aria-current={selected ? "true" : undefined}
          className="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground outline-none after:absolute after:inset-0"
        >
          {streamer.displayName}
        </button>

        <span
          title={`${streamer.matchupCount} ghosts`}
          className="hidden shrink-0 items-center gap-1 text-xs tabular-nums text-muted-foreground @[200px]:flex"
        >
          <Ghost aria-hidden className="size-3.5" />
          <span className="sr-only">Ghosts: </span>
          {streamer.matchupCount}
        </span>
        <span
          title={`${streamer.sessionCount} recordings`}
          className="hidden shrink-0 items-center gap-1 text-xs tabular-nums text-muted-foreground @[260px]:flex"
        >
          <Video aria-hidden className="size-3.5" />
          <span className="sr-only">Recordings: </span>
          {streamer.sessionCount}
        </span>
        <SourceStack
          sources={streamer.platforms.map((platform) => ({ platform }))}
          className="hidden @[320px]:flex"
        />
      </div>
    </div>
  );
});

export function StreamerResultRowSkeleton() {
  return (
    <div className="@container box-border flex h-[72px] items-center gap-3 rounded-lg border border-border bg-card px-3">
      <Skeleton className="hidden size-9 shrink-0 rounded-full @[150px]:block" />
      <Skeleton className="h-4 w-1/3 max-w-40" />
      <Skeleton className="ml-auto hidden h-4 w-10 @[200px]:block" />
    </div>
  );
}
