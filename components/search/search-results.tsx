"use client";

import { useCallback } from "react";
import { Loader2 } from "lucide-react";
import { VirtualizedResultList } from "@/components/virtualized-result-list";
import {
  GhostResultRow,
  type GhostResult,
} from "@/components/ghost-result-row";
import { VodResultRow, type VodResult } from "@/components/vod-result-row";
import { StreamerResultRow } from "@/components/streamer-result-row";
import { Bookmark } from "lucide-react";
import type { SearchMode, StreamerOption } from "./types";

/**
 * Props for {@link SearchResults}.
 */
interface SearchResultsProps {
  searchMode: SearchMode;
  queryParam: string;

  // Saved state
  savedResults: GhostResult[];
  isSavedLoading: boolean;
  isSavedEmpty: boolean;

  // Ghost state
  ghostResults: GhostResult[];
  ghostTotalResults: number;
  isGhostLoading: boolean;
  isGhostLoadingMore: boolean;
  hasMoreGhosts: boolean;
  loadMoreGhosts: () => void;

  // VOD state
  vodResults: VodResult[];
  vodTotalResults: number;
  isVodLoading: boolean;
  isVodLoadingMore: boolean;
  hasMoreVods: boolean;
  loadMoreVods: () => void;

  // Streamer state
  filteredStreamers: StreamerOption[];
  hasMoreCreators: boolean; loadMoreCreators: () => void; creatorsLoading: boolean;

  // Navigation handlers
  onNavigateToStreamer: (streamerId: string, name: string) => void;
  onNavigateToVodGhosts: (vodSourceId: string, title: string) => void;
  onStreamerClick: (streamerId: string, name: string) => void;
}

/**
 * Renders the active search mode's result list inside a
 * {@link VirtualizedResultList}.
 *
 * Switches between ghost, VOD, and streamer result renderers based on
 * `searchMode`.  Shows an empty-state message when no results are found for a
 * given query, and a centered spinner while the initial fetch is in progress.
 *
 * Ghost results support date grouping, fuzzy search partitioning (prefix vs
 * "other matches"), and sticky date headers via `getItemDate` /
 * `getItemMatchField` / `searchQuery` props on the virtualizer.
 */
export function SearchResults({
  searchMode,
  queryParam,
  savedResults,
  isSavedLoading,
  isSavedEmpty,
  ghostResults,
  ghostTotalResults,
  isGhostLoading,
  isGhostLoadingMore,
  hasMoreGhosts,
  loadMoreGhosts,
  vodResults,
  vodTotalResults,
  isVodLoading,
  isVodLoadingMore,
  hasMoreVods,
  loadMoreVods,
  filteredStreamers,hasMoreCreators,loadMoreCreators,creatorsLoading,
  onNavigateToStreamer,
  onNavigateToVodGhosts,
  onStreamerClick,
}: SearchResultsProps) {
  const renderGhost = useCallback(
    (ghost: GhostResult) => (
      <GhostResultRow ghost={ghost} onNavigateToStreamer={onNavigateToStreamer} />
    ),
    [onNavigateToStreamer]
  );
  const renderVod = useCallback(
    (vod: VodResult) => (
      <VodResultRow
        vod={vod}
        onNavigateToStreamer={onNavigateToStreamer}
        onNavigateToGhosts={onNavigateToVodGhosts}
      />
    ),
    [onNavigateToStreamer, onNavigateToVodGhosts]
  );
  const renderStreamer = useCallback(
    (s: StreamerOption) => (
      <StreamerResultRow streamer={s} onNavigateToVods={onStreamerClick} />
    ),
    [onStreamerClick]
  );
  const isLoading =
    (searchMode === "ghosts" && isGhostLoading) ||
    (searchMode === "vods" && isVodLoading) ||
    (searchMode === "saved" && isSavedLoading);

  return (
    <>
      {searchMode === "saved" && (
        <>
          {savedResults.length > 0 && (
            <VirtualizedResultList
              items={savedResults}
              totalCount={savedResults.length}
              quiet
              getItemKey={(g) => g.matchup_id}
              renderItem={renderGhost}
              onLoadMore={() => {}}
              isLoadingMore={false}
              hasMore={false}
            />
          )}
          {isSavedEmpty && (
            <div className="flex flex-1 items-center justify-center py-16">
              <Bookmark aria-hidden className="size-10 text-muted-foreground/30" />
            </div>
          )}
        </>
      )}

      {searchMode === "ghosts" && (
        <>
          {!isGhostLoading && ghostResults.length > 0 && (
            <VirtualizedResultList
              items={ghostResults}
              totalCount={ghostTotalResults}
              getItemKey={(g) => g.matchup_id}
              getItemDate={(g) => g.actual_timestamp}
              getItemMatchField={(g) => g.username}
              searchQuery={queryParam}
              renderItem={renderGhost}
              onLoadMore={loadMoreGhosts}
              isLoadingMore={isGhostLoadingMore}
              hasMore={hasMoreGhosts}
            />
          )}
          {!isGhostLoading && ghostResults.length === 0 && queryParam && (
            <p className="px-4 py-16 text-center text-muted-foreground">
              No ghosts found for &ldquo;{queryParam}&rdquo;
            </p>
          )}
        </>
      )}

      {searchMode === "vods" && (
        <>
          {!isVodLoading && vodResults.length > 0 && (
            <VirtualizedResultList
              items={vodResults}
              totalCount={vodTotalResults}
              getItemKey={(v) => v.vod_source_id}
              getItemDate={(v) => v.published_at}
              renderItem={renderVod}
              onLoadMore={loadMoreVods}
              isLoadingMore={isVodLoadingMore}
              hasMore={hasMoreVods}
            />
          )}
          {!isVodLoading && vodResults.length === 0 && queryParam && (
            <p className="px-4 py-16 text-center text-muted-foreground">
              No VODs found for &ldquo;{queryParam}&rdquo;
            </p>
          )}
        </>
      )}

      {searchMode === "streamers" && (
        <>
          {filteredStreamers.length > 0 ? (
            <VirtualizedResultList
              items={filteredStreamers}
              totalCount={filteredStreamers.length}
              getItemKey={(s) =>
                s.streamer_id ??
                s.streamer_login ??
                s.streamer_display_name ??
                "unknown"
              }
              renderItem={renderStreamer}
              onLoadMore={loadMoreCreators}
              isLoadingMore={creatorsLoading}
              hasMore={hasMoreCreators}
            />
          ) : (
            queryParam && (
              <p className="px-4 py-16 text-center text-muted-foreground">
                No streamers found for &ldquo;{queryParam}&rdquo;
              </p>
            )
          )}
        </>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </>
  );
}
