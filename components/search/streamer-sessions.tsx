"use client";

import { useCallback } from "react";
import { VirtualizedResultList } from "@/components/virtualized-result-list";
import { VodResultRow } from "@/components/vod-result-row";
import { Skeleton } from "@/components/ui/skeleton";
import type { VodResult } from "@/lib/result-models";

/** A Streamer's Sessions, one row each. */
export function StreamerSessions({ sessions, isLoading, isLoadingMore, hasMore, loadMore, onNavigateToStreamer, onNavigateToVodGhosts }: {
  sessions: VodResult[]; isLoading: boolean; isLoadingMore: boolean; hasMore: boolean; loadMore: () => void;
  onNavigateToStreamer: (streamerId: string, name: string) => void;
  onNavigateToVodGhosts: (vodSourceId: string, title: string) => void;
}) {
  const renderSession = useCallback(
    (session: VodResult) => (
      <VodResultRow vod={session} onNavigateToStreamer={onNavigateToStreamer} onNavigateToGhosts={onNavigateToVodGhosts} />
    ),
    [onNavigateToStreamer, onNavigateToVodGhosts],
  );
  if (isLoading)
    return (
      <div className="flex flex-col gap-2 p-2" aria-busy="true">
        {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-[72px] w-full" />)}
      </div>
    );
  return (
    <VirtualizedResultList
      items={sessions}
      totalCount={sessions.length}
      getItemKey={(s) => s.vod_source_id}
      getItemDate={(s) => s.published_at}
      renderItem={renderSession}
      onLoadMore={loadMore}
      isLoadingMore={isLoadingMore}
      hasMore={hasMore}
    />
  );
}
