"use client";

import { useCallback } from "react";
import { Bookmark, Ghost, Users, Video } from "lucide-react";
import { VirtualizedResultList } from "@/components/virtualized-result-list";
import { GhostResultRow, type GhostResult } from "@/components/ghost-result-row";
import { Skeleton } from "@/components/ui/skeleton";
import type { SessionCard, StreamerCard } from "@/lib/api-contract";
import { ResultList } from "./result-list";
import { RecordingRow, StreamerRow } from "./rows";
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

function Skeletons() {
  return (
    <div className="flex flex-col gap-2 p-2" aria-busy="true">
      {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-[72px] w-full bg-muted" />)}
    </div>
  );
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
      <StreamerRow streamer={s} selected={String(s.id) === selectedStreamerId} onSelect={() => onSelectStreamer(s)} onPrefetch={() => onPrefetchStreamer(s)} />
    ),
    [selectedStreamerId, onSelectStreamer, onPrefetchStreamer],
  );
  const renderRecording = useCallback(
    (s: SessionCard) => (
      <RecordingRow session={s} selected={s.id === selectedSessionId} active={s.id === playingSessionId} onSelect={() => onSelectRecording(s)} onPrefetch={() => onPrefetchRecording(s)} />
    ),
    [selectedSessionId, playingSessionId, onSelectRecording, onPrefetchRecording],
  );

  if (mode === "saved")
    return saved.items.length > 0 ? (
      <ResultList scrollKey={scrollKey} stale={false}>
        <VirtualizedResultList items={saved.items} totalCount={saved.items.length} getItemKey={(g) => g.matchup_id} renderItem={renderGhost} onLoadMore={saved.loadMore} isLoadingMore={saved.loadingMore} hasMore={saved.hasMore} />
      </ResultList>
    ) : saved.loading ? <Skeletons /> : saved.empty ? <None icon={Bookmark} /> : null;

  if (mode === "ghosts")
    return ghosts.items.length > 0 ? (
      <ResultList scrollKey={scrollKey} stale={ghosts.stale}>
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
          hasMore={ghosts.hasMore}
        />
      </ResultList>
    ) : ghosts.loading ? <Skeletons /> : <None icon={Ghost} />;

  if (mode === "streamers")
    return streamers.items.length > 0 ? (
      <ResultList scrollKey={scrollKey} stale={streamers.stale}>
        <VirtualizedResultList items={streamers.items} totalCount={streamers.items.length} getItemKey={(s) => s.id} renderItem={renderStreamer} onLoadMore={streamers.loadMore} isLoadingMore={streamers.loadingMore} hasMore={streamers.hasMore} />
      </ResultList>
    ) : streamers.loading ? <Skeletons /> : <None icon={Users} />;

  return recordings.items.length > 0 ? (
    <ResultList scrollKey={scrollKey} stale={recordings.stale}>
      <VirtualizedResultList
        items={recordings.items}
        totalCount={recordings.items.length}
        getItemKey={(s) => s.id}
        getItemDate={queryParam ? undefined : (s) => s.startedAt ?? ""}
        renderItem={renderRecording}
        onLoadMore={recordings.loadMore}
        isLoadingMore={recordings.loadingMore}
        hasMore={recordings.hasMore}
      />
    </ResultList>
  ) : recordings.loading ? <Skeletons /> : <None icon={Video} />;
}
