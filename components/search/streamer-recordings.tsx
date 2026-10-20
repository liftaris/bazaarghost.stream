"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlatformIcon } from "@/components/platform-icon";
import { RecordingResultRow, RecordingResultRowSkeleton } from "@/components/recording-result-row";
import type { SessionCard } from "@/lib/api-contract";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { VirtualizedResultList } from "@/components/virtualized-result-list";
import { getPlatform } from "@/lib/platforms";
import { filterParams, type PlatformFilter } from "@/lib/search-filters";
import { useApiPage } from "./hooks/use-api-page";
import { useStreamer } from "./hooks/use-streamer-options";


/** Avatar, name and the Streamer's Channels, each linking out to its page on its platform. */
function StreamerHeader({ streamerId }: { streamerId: string }) {
  const { streamer } = useStreamer(streamerId);
  if (!streamer) return <Skeleton className="m-2 h-9 bg-muted" />;
  return (
    <div className="flex items-center gap-3 border-b border-border px-3 py-2">
      <Avatar className="size-9 shrink-0">
        <AvatarImage src={streamer.avatarUrl ?? undefined} alt="" />
        <AvatarFallback className="bg-primary text-xs text-primary-foreground">{streamer.displayName[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>
      <h2 className="min-w-0 flex-1 truncate text-sm font-medium">{streamer.displayName}</h2>
      <ul className="flex shrink-0 items-center gap-1.5" aria-label="Channels">
        {streamer.channels.map((channel) => {
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
export function StreamerRecordings({ streamerId, filter, activeSessionId, onPlay, onPrefetch }: {
  streamerId: string;
  filter: PlatformFilter;
  activeSessionId: string | null;
  onPlay: (session: SessionCard) => void;
  onPrefetch: (session: SessionCard) => void;
}) {
  const { platform, excludePlatform } = filterParams({ ...filter, from: null, to: null });
  const result = useApiPage("/sessions", { streamerId, platform, excludePlatform });
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <StreamerHeader streamerId={streamerId} />
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
