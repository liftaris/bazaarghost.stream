"use client";

import { useCallback, type ReactNode } from "react";
import { Bookmark, Ghost, Users, Video } from "lucide-react";
import { VirtualizedResultList } from "@/components/virtualized-result-list";
import { GhostResultRow, type GhostResult } from "@/components/ghost-result-row";
import type { SessionCard, StreamerCard } from "@/lib/api-contract";
import { Skeleton } from "@/components/ui/skeleton";
import { RecordingResultRow, RecordingResultRowSkeleton } from "@/components/recording-result-row";
import { StreamerResultRow, StreamerResultRowSkeleton } from "@/components/streamer-result-row";
import { ScrollMemory } from "./scroll-memory";
import type { SearchMode } from "./types";

/** One mode's paged list. */
interface ListState<T> {
  items: T[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  /** Showing the previous query's results while the next ones load. */
  stale: boolean;
}

interface SearchResultsProps {
  mode: SearchMode;
  queryParam: string;
  /** Mode + filters: the identity of the list's scroll position. */
  scrollKey: string;
  saved: ListState<GhostResult> & { empty: boolean };
  ghosts: ListState<GhostResult>;
  streamers: ListState<StreamerCard>;
  recordings: ListState<SessionCard>;
  /** Selection URL for a ghost row (carries the list params). */
  ghostHref: (matchupId: number) => string;
  selectedStreamerId: string | null;
  selectedSessionId: string | null;
  playingSessionId: string | null;
  onNavigateToStreamer: (streamerId: string) => void;
  onSelectStreamer: (streamer: StreamerCard) => void;
  onSelectRecording: (session: SessionCard) => void;
  onPrefetchStreamer: (streamer: StreamerCard) => void;
  onPrefetchRecording: (session: SessionCard) => void;
}

function Skeletons({ row: Row }: { row: () => ReactNode }) {
  return (
    <div className="flex flex-col gap-2 p-2" aria-busy="true">
      {Array.from({ length: 8 }, (_, i) => <Row key={i} />)}
    </div>
  );
}

function GhostSkeleton() {
  return <Skeleton className="h-[72px] w-full" />;
}

function None({ icon: Icon }: { icon: typeof Ghost }) {
  return (
    <div role="status" className="flex flex-1 items-center justify-center py-16">
      <Icon aria-hidden className="size-10 text-muted-foreground/30" />
      <span className="sr-only">No results</span>
    </div>
  );
}

/** The active mode's result list: previous results stay while loading, skeletons only when there are none. */
export function SearchResults({
  mode, queryParam, scrollKey, saved, ghosts, streamers, recordings, ghostHref, selectedStreamerId, selectedSessionId,
  playingSessionId, onNavigateToStreamer, onSelectStreamer, onSelectRecording, onPrefetchStreamer, onPrefetchRecording,
}: SearchResultsProps) {
  const renderGhost = useCallback(
    (ghost: GhostResult) => <GhostResultRow ghost={ghost} href={ghostHref(ghost.matchup_id)} onNavigateToStreamer={onNavigateToStreamer} />,
    [ghostHref, onNavigateToStreamer],
  );
  const renderStreamer = useCallback(
    (s: StreamerCard) => (
      <StreamerResultRow streamer={s} selected={String(s.id) === selectedStreamerId} onSelect={() => onSelectStreamer(s)} onPrefetch={() => onPrefetchStreamer(s)} />
    ),
    [selectedStreamerId, onSelectStreamer, onPrefetchStreamer],
  );
  const renderRecording = useCallback(
    (s: SessionCard) => (
      <RecordingResultRow session={s} selected={s.id === selectedSessionId} active={s.id === playingSessionId} onSelect={() => onSelectRecording(s)} onPrefetch={() => onPrefetchRecording(s)} />
    ),
    [selectedSessionId, playingSessionId, onSelectRecording, onPrefetchRecording],
  );

  if (mode === "saved")
    return saved.items.length > 0 ? (
      <ScrollMemory scrollKey={scrollKey} stale={false}>
        <VirtualizedResultList items={saved.items} totalCount={saved.items.length} getItemKey={(g) => g.matchup_id} renderItem={renderGhost} onLoadMore={saved.loadMore} isLoadingMore={saved.loadingMore} hasMore={saved.hasMore} />
      </ScrollMemory>
    ) : saved.loading ? <Skeletons row={GhostSkeleton} /> : saved.empty ? <None icon={Bookmark} /> : null;

  if (mode === "ghosts")
    return ghosts.items.length > 0 ? (
      <ScrollMemory scrollKey={scrollKey} stale={ghosts.stale}>
        <VirtualizedResultList
          items={ghosts.items}
          totalCount={ghosts.items.length}
          getItemKey={(g) => g.matchup_id}
          getItemDate={(g) => g.actual_timestamp}
          getItemMatchField={(g) => g.username}
          searchQuery={queryParam}
          renderItem={renderGhost}
          onLoadMore={ghosts.loadMore}
          isLoadingMore={ghosts.loadingMore}
          hasMore={ghosts.hasMore} stale={ghosts.stale}
        />
      </ScrollMemory>
    ) : ghosts.loading ? <Skeletons row={GhostSkeleton} /> : <None icon={Ghost} />;

  if (mode === "streamers")
    return streamers.items.length > 0 ? (
      <ScrollMemory scrollKey={scrollKey} stale={streamers.stale}>
        <VirtualizedResultList items={streamers.items} totalCount={streamers.items.length} getItemKey={(s) => s.id} renderItem={renderStreamer} onLoadMore={streamers.loadMore} isLoadingMore={streamers.loadingMore} hasMore={streamers.hasMore} stale={streamers.stale} />
      </ScrollMemory>
    ) : streamers.loading ? <Skeletons row={StreamerResultRowSkeleton} /> : <None icon={Users} />;

  return recordings.items.length > 0 ? (
    <ScrollMemory scrollKey={scrollKey} stale={recordings.stale}>
      <VirtualizedResultList
        items={recordings.items}
        totalCount={recordings.items.length}
        getItemKey={(s) => s.id}
        getItemDate={queryParam ? undefined : (s) => s.startedAt ?? ""}
        renderItem={renderRecording}
        onLoadMore={recordings.loadMore}
        isLoadingMore={recordings.loadingMore}
        hasMore={recordings.hasMore} stale={recordings.stale}
      />
    </ScrollMemory>
  ) : recordings.loading ? <Skeletons row={RecordingResultRowSkeleton} /> : <None icon={Video} />;
}
