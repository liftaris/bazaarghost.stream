"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlatformIcon } from "@/components/platform-icon";
import { RecordingResultRow, RecordingResultRowSkeleton } from "@/components/recording-result-row";
import type { SessionCard, StreamerCard } from "@/lib/api-contract";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { VirtualizedResultList } from "@/components/virtualized-result-list";
import { getPlatform } from "@/lib/platforms";
import { filterParams, type PlatformFilter } from "@/lib/search-filters";
import { useApiPage } from "./hooks/use-api-page";
import { useStreamer } from "./hooks/use-streamer-options";


/** Avatar, name and the Streamer's Channels, each linking out to its page on its platform. */
export function StreamerHeader({ streamerId, card, children }: { streamerId: string; card: StreamerCard | null; children?: ReactNode }) {
  const { streamer } = useStreamer(streamerId);
  const shown = streamer ?? card;
  if (!shown) return <Skeleton className="m-2 h-9" />;
  return (
    <div className="mx-auto flex w-full max-w-5xl items-center gap-3 border-b border-border px-3 py-2">
      <Avatar className="size-9 shrink-0">
        <AvatarImage src={shown.avatarUrl ?? undefined} alt="" />
        <AvatarFallback className="bg-primary text-xs text-primary-foreground">{shown.displayName[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>
      <h2 className={cn("min-w-0 truncate text-sm font-medium", children ? "max-w-[35%] shrink-0" : "flex-1")}>{shown.displayName}</h2>
      {children}
      <ul className="flex shrink-0 items-center gap-1.5" aria-label="Channels">
        {!streamer && card?.platforms.map((platform) => (
          <li key={platform} className="flex size-7 items-center justify-center text-muted-foreground">
            <PlatformIcon platform={platform} className="size-4" />
          </li>
        ))}
        {streamer?.channels.map((channel) => {
          const label = `${getPlatform(channel.platform).name} · ${channel.displayName}`;
          return (
            <li key={channel.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  {channel.url ? (
                    <a href={channel.url} target="_blank" rel="noreferrer" aria-label={label} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                      <PlatformIcon platform={channel.platform} decorative className="size-4" />
                    </a>
                  ) : (
                    <span role="img" aria-label={label} className="flex size-7 items-center justify-center text-muted-foreground">
                      <PlatformIcon platform={channel.platform} decorative className="size-4" />
                    </span>
                  )}
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
              </Tooltip>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The selected Streamer: compact header and its Recordings; a click plays one in the player above. */
export function StreamerRecordings({ streamerId, card, filter, activeSessionId, onPlay, onPrefetch }: {
  streamerId: string;
  /** The clicked row's data, shown until the Streamer itself loads. */
  card: StreamerCard | null;
  filter: PlatformFilter;
  activeSessionId: string | null;
  onPlay: (session: SessionCard) => void;
  onPrefetch: (session: SessionCard) => void;
}) {
  const { platform, excludePlatform } = filterParams({ ...filter, from: null, to: null });
  const result = useApiPage("/sessions", { streamerId, platform, excludePlatform });
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <StreamerHeader streamerId={streamerId} card={card} />
      {result.items.length > 0 ? (
        <VirtualizedResultList
          items={result.items}
          totalCount={result.items.length}
          getItemKey={(s) => s.id}
          renderItem={(session) => (
            <RecordingResultRow session={session} active={session.id === activeSessionId} onSelect={() => onPlay(session)} onPrefetch={() => onPrefetch(session)} />
          )}
          onLoadMore={result.loadMore}
          isLoadingMore={result.loadingMore}
          hasMore={result.hasMore}
          stale={result.isStale}
          activeKey={activeSessionId}
        />
      ) : result.loading ? (
        <div className="flex flex-col gap-2 p-2" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => <RecordingResultRowSkeleton key={i} />)}
        </div>
      ) : null}
    </div>
  );
}
