"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useSearchUrl } from "./hooks/use-search-url";
import { useStreamerOptions } from "./hooks/use-streamer-options";
import { useGhostSearch } from "./hooks/use-ghost-search";
import { useVodSearch } from "./hooks/use-vod-search";
import { useSessionSearch } from "./hooks/use-session-search";
import { useChannelName } from "./hooks/use-channel-name";
import { usePlatformOptions } from "./hooks/use-platform-options";
import { useSavedMatchups } from "./hooks/use-saved-matchups";
import { useAuth } from "@/components/auth/auth-provider";

import { SearchHeader } from "./search-header";
import { SearchResults } from "./search-results";
import { StreamerPicker } from "./streamer-picker";
import type { StreamerOption } from "./types";
import { StreamerProfile, type StreamerView } from "./streamer-profile";
import { StreamerSessions } from "./streamer-sessions";
import { SearchLayout } from "./desktop-layout";

/**
 * Props for {@link SearchPanel}.
 */
interface SearchPanelProps {
  showSearchTabs?: boolean;
}

/**
 * Top-level search panel orchestrator.
 *
 * Composes the search hooks ({@link useSearchUrl}, {@link useStreamerOptions},
 * {@link useGhostSearch}, {@link useVodSearch}) with the presentational
 * components ({@link SearchHeader}, {@link SearchResults}) inside the single
 * CSS-responsive {@link SearchLayout}.
 *
 * This component owns no data-fetching or URL-mutation logic itself — it
 * delegates entirely to the hooks and passes their return values through as
 * props to the UI layer.
 */
export default function SearchPanel({
  showSearchTabs = false,
}: SearchPanelProps) {
  const router = useRouter();

  // ---- URL state ----
  const {
    searchMode,
    routeContext,
    queryParam,
    effectiveStreamer,
    effectiveVod,
    channelParam,
    platformParam,
    inputValue,
    handleInputChange,
    replaceParams,
  } = useSearchUrl();

  // ---- Saved matchups ----
  const { state: authState } = useAuth();
  const {
    ghostResults: savedResults,
    isLoading: isSavedLoading,
    isEmpty: isSavedEmpty,
    isLoadingMore: isSavedLoadingMore,
    error: savedError,
    retry: retrySaved,
    hasMore: hasMoreSaved,
    loadMore: loadMoreSaved,
  } = useSavedMatchups({ enabled: searchMode === "saved" && authState.status === "authenticated", query: queryParam });

  useEffect(() => {
    if (searchMode === "saved" && (authState.status === "anonymous" || authState.status === "disabled"))
      router.replace("/login?next=/saved");
  }, [searchMode, authState.status, router]);

  // ---- Streamer options & picker ----
  const {
    streamer,
    streamerOptions,
    resolvedStreamer,
    filteredStreamers,
    openStreamerPopover,
    setOpenStreamerPopover,
    handleSelectStreamer,
    pickerQuery,setPickerQuery,loading:creatorsLoading,error:creatorsError,hasMore:moreCreators,loadMore:loadCreators,retry:retryCreators,filterReady,
  } = useStreamerOptions({
    effectiveStreamer,
    searchMode,
    queryParam,
    replaceParams,
    routePathStreamer: routeContext.pathStreamer,
  });

  // ---- Ghost search ----
  const {
    ghostResults,
    totalResults: ghostTotalResults,
    isLoading: isGhostLoading,
    isLoadingMore: isGhostLoadingMore,
    hasMoreGhosts,
    loadMoreGhosts,isStale:isGhostStale,error:ghostError,retry:retryGhosts,
  } = useGhostSearch({
    queryParam,
    streamerId: resolvedStreamer?.id ?? null,
    channelId: channelParam,
    platform: platformParam,
    effectiveVod,
    enabled: searchMode === "ghosts" && filterReady,
  });

  // ---- Streamer page (Sessions) ----
  const [view, setView] = useState<StreamerView>("matchups");
  const sessionsShown = routeContext.streamerPage && view === "sessions";
  const sessions = useSessionSearch({
    streamerId: resolvedStreamer?.id ?? null,
    enabled: sessionsShown && filterReady,
  });
  const platformOptions = usePlatformOptions(
    ghostResults,
    `${queryParam}|${resolvedStreamer?.id}|${channelParam}`,
    platformParam,
  );

  const channelName = useChannelName(channelParam);

  // ---- VOD search ----
  const {
    vodResults,
    totalResults: vodTotalResults,
    isLoading: isVodLoading,
    isLoadingMore: isVodLoadingMore,
    hasMoreVods,
    loadMoreVods,error:vodError,retry:retryVods,
  } = useVodSearch({
    queryParam,
    streamerId: resolvedStreamer?.id ?? null,
    enabled: searchMode === "vods" && filterReady,
  });

  /** Navigate to a streamer's page. */
  const handleNavigateToStreamer = useCallback(
    (streamerId: string) => {
      router.push(`/streamers/${encodeURIComponent(streamerId)}`, { scroll: false });
    },
    [router]
  );

  /** Add a `?vod=` filter to show ghosts for a specific VOD. */
  const handleNavigateToVodGhosts = useCallback(
    (vodSourceId: string) => {
      replaceParams({ vod: vodSourceId });
    },
    [replaceParams]
  );

  /** Navigate to a streamer's page (used from the streamers result list). */
  const handleStreamerClick = useCallback(
    (streamerId: string) => {
      router.push(`/streamers/${encodeURIComponent(streamerId)}`, { scroll: false });
    },
    [router]
  );

  /** Build a tab href that preserves the current `?q=` across mode switches. */
  const buildModeHref = useCallback(
    (baseHref: string) => {
      if (queryParam) return `${baseHref}?q=${encodeURIComponent(queryParam)}`;
      return baseHref;
    },
    [queryParam]
  );

  /** Navigate to a different search mode tab. */
  const handleModeChange = useCallback(
    (href: string) => {
      router.push(buildModeHref(href));
    },
    [router, buildModeHref]
  );

  // ---- Shared UI elements ----
  const isLoading =
    (searchMode === "ghosts" && (sessionsShown ? sessions.isLoading : isGhostLoading)) ||
    (searchMode === "vods" && isVodLoading) ||
    (searchMode === "saved" && isSavedLoading);

  const pickStreamer = (option: StreamerOption | null) => {
    setOpenStreamerPopover(false);
    router.push(option ? `/streamers/${encodeURIComponent(option.streamer_id)}` : "/search");
  };
  const searchHeader = (
    <SearchHeader
      searchMode={searchMode}
      showSearchTabs={showSearchTabs}
      inputValue={inputValue}
      isLoading={isLoading}
      onInputChange={handleInputChange}
      onModeChange={handleModeChange}
      streamerOptions={streamerOptions}
      resolvedStreamer={resolvedStreamer}
      effectiveStreamer={effectiveStreamer}
      openStreamerPopover={openStreamerPopover}
      onOpenStreamerPopover={setOpenStreamerPopover}
      onSelectStreamer={handleSelectStreamer}
      pickerQuery={pickerQuery} onPickerQuery={setPickerQuery} moreCreators={moreCreators} onLoadCreators={loadCreators}
      profile={routeContext.streamerPage ? (
        <StreamerProfile streamer={streamer} view={view} onViewChange={setView} picker={
          <StreamerPicker
            streamerOptions={streamerOptions} pickerQuery={pickerQuery} onPickerQuery={setPickerQuery} moreCreators={moreCreators} onLoadCreators={loadCreators}
            resolvedStreamer={resolvedStreamer} effectiveStreamer={effectiveStreamer}
            open={openStreamerPopover} onOpenChange={setOpenStreamerPopover} onSelect={pickStreamer}
          />
        } />
      ) : undefined}
      hideInput={sessionsShown}
      platforms={sessionsShown ? [] : platformOptions}
      platform={sessionsShown ? null : platformParam}
      onPlatformChange={(next) => replaceParams({ platform: next })}
      channelName={channelName}
      onClearChannel={() => replaceParams({ channel: null })}
    />
  );

  const error = searchMode === "saved" ? savedError : creatorsError ?? (searchMode === "ghosts" ? (sessionsShown ? sessions.error : ghostError) : vodError);
  const retry = searchMode === "saved" ? retrySaved : creatorsError ? retryCreators : searchMode === "ghosts" ? (sessionsShown ? sessions.retry : retryGhosts) : retryVods;
  const searchResults = (<>
    {error && <div role="alert" className="p-4">{error} <button onClick={retry}>Retry</button></div>}
    {sessionsShown ? (
      <StreamerSessions {...sessions} onNavigateToStreamer={handleNavigateToStreamer} onNavigateToVodGhosts={(vodSourceId) => { setView("matchups"); handleNavigateToVodGhosts(vodSourceId); }} />
    ) : <SearchResults
      searchMode={searchMode}
      queryParam={queryParam}
      savedResults={savedResults}
      isSavedLoading={isSavedLoading}
      isSavedLoadingMore={isSavedLoadingMore}
      isSavedEmpty={isSavedEmpty}
      hasMoreSaved={hasMoreSaved}
      loadMoreSaved={loadMoreSaved}
      ghostResults={ghostResults}
      ghostTotalResults={ghostTotalResults}
      isGhostLoading={isGhostLoading}
      isGhostStale={isGhostStale}
      isGhostLoadingMore={isGhostLoadingMore}
      hasMoreGhosts={hasMoreGhosts}
      loadMoreGhosts={loadMoreGhosts}
      vodResults={vodResults}
      vodTotalResults={vodTotalResults}
      isVodLoading={isVodLoading}
      isVodLoadingMore={isVodLoadingMore}
      hasMoreVods={hasMoreVods}
      loadMoreVods={loadMoreVods}
      filteredStreamers={filteredStreamers}
      hasMoreCreators={moreCreators} loadMoreCreators={loadCreators} creatorsLoading={creatorsLoading}
      onNavigateToStreamer={handleNavigateToStreamer}
      onNavigateToVodGhosts={handleNavigateToVodGhosts}
      onStreamerClick={handleStreamerClick}
    />}</>
  );

  return (
    <SearchLayout
      searchHeader={searchHeader}
      searchResults={searchResults}
    />
  );
}
