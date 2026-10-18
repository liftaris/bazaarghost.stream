"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEmbed } from "@/components/embed-provider";
import { useIsMobile } from "@/hooks/use-mobile";
import type { VodResult } from "@/components/vod-result-row";

import { useSearchUrl } from "./hooks/use-search-url";
import { useStreamerOptions } from "./hooks/use-streamer-options";
import { useGhostSearch } from "./hooks/use-ghost-search";
import { useVodSearch } from "./hooks/use-vod-search";
import { useSavedMatchups } from "./hooks/use-saved-matchups";
import { useAuth } from "@/components/auth/auth-provider";

import { SearchHeader } from "./search-header";
import { SearchResults } from "./search-results";
import { DesktopLayout } from "./desktop-layout";
import { MobileLayout } from "./mobile-layout";

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
 * components ({@link SearchHeader}, {@link SearchResults}) and selects the
 * appropriate layout ({@link DesktopLayout} or {@link MobileLayout}) based on
 * viewport width.
 *
 * This component owns no data-fetching or URL-mutation logic itself — it
 * delegates entirely to the hooks and passes their return values through as
 * props to the UI layer.
 */
export default function SearchPanel({
  showSearchTabs = false,
}: SearchPanelProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const {
    isVisible: embedVisible,
    videoId: activeVideoId,
    currentTime: activeTime,
  } = useEmbed();

  // ---- URL state ----
  const {
    searchMode,
    routeContext,
    queryParam,
    effectiveStreamer,
    effectiveVod,
    inputValue,
    handleInputChange,
    replaceParams,
    buildSearchUrl,
  } = useSearchUrl();

  // ---- Saved matchups ----
  const { state: authState } = useAuth();
  const {
    ghostResults: savedResults,
    isLoading: isSavedLoading,
    isEmpty: isSavedEmpty,
  } = useSavedMatchups({ enabled: searchMode === "saved", query: queryParam });

  useEffect(() => {
    if (searchMode === "saved" && (authState.status === "anonymous" || authState.status === "disabled"))
      router.replace("/login?next=/saved");
  }, [searchMode, authState.status, router]);

  // ---- Streamer options & picker ----
  const {
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
    loadMoreGhosts,error:ghostError,retry:retryGhosts,
  } = useGhostSearch({
    queryParam,
    streamerId: resolvedStreamer?.id ?? null,
    effectiveVod,
    enabled: searchMode === "ghosts" && filterReady,
  });

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

  /** Navigate to a streamer's page at `/:name`. */
  const handleNavigateToStreamer = useCallback(
    (streamerId: string, _name: string) => {
      router.push(`/search?streamer=${encodeURIComponent(streamerId)}`, { scroll: false });
    },
    [router]
  );

  /** Add a `?vod=` filter to show ghosts for a specific VOD. */
  const handleNavigateToVodGhosts = useCallback(
    (vodSourceId: string, _title: string) => {
      replaceParams({ vod: vodSourceId });
    },
    [replaceParams]
  );

  /** Navigate to the VOD embed route at `/:name/:vodId`. */
  const handleVodClick = useCallback(
    (vod: VodResult) => {
      const path = `/videos/${vod.vod_id}`;
      router.push(path, { scroll: false });
    },
    [router]
  );

  /** Navigate to a streamer's page (used from the streamers result list). */
  const handleStreamerClick = useCallback(
    (streamerId: string, _name: string) => {
      router.push(`/search?streamer=${encodeURIComponent(streamerId)}`, { scroll: false });
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

  // ---- Measure search header height for mobile sheet ----
  const searchHeaderRef = useRef<HTMLDivElement>(null);
  const [searchHeaderHeight, setSearchHeaderHeight] = useState(0);

  useEffect(() => {
    const el = searchHeaderRef.current;
    if (!el) return;
    const measure = () =>
      setSearchHeaderHeight(el.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isMobile]);

  // ---- Shared UI elements ----
  const isLoading =
    (searchMode === "ghosts" && isGhostLoading) ||
    (searchMode === "vods" && isVodLoading) ||
    (searchMode === "saved" && isSavedLoading);

  const searchHeader = (
    <SearchHeader
      ref={searchHeaderRef}
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
    />
  );

  const error = searchMode === "saved" ? null : creatorsError ?? (searchMode === "ghosts" ? ghostError : vodError);
  const retry = creatorsError ? retryCreators : searchMode === "ghosts" ? retryGhosts : retryVods;
  const searchResults = (<>
    {error && <div role="alert" className="p-4">{error} <button onClick={retry}>Retry</button></div>}
    <SearchResults
      searchMode={searchMode}
      queryParam={queryParam}
      savedResults={savedResults}
      isSavedLoading={isSavedLoading}
      isSavedEmpty={isSavedEmpty}
      ghostResults={ghostResults}
      ghostTotalResults={ghostTotalResults}
      isGhostLoading={isGhostLoading}
      isGhostLoadingMore={isGhostLoadingMore}
      hasMoreGhosts={hasMoreGhosts}
      loadMoreGhosts={loadMoreGhosts}
      activeVideoId={activeVideoId}
      activeTime={activeTime}
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
      onVodClick={handleVodClick}
      onStreamerClick={handleStreamerClick}
    /></>
  );

  // ---- Layout branching ----
  if (isMobile) {
    return (
      <MobileLayout
        searchHeader={searchHeader}
        searchResults={searchResults}
        searchHeaderHeight={searchHeaderHeight}
      />
    );
  }

  return (
    <>
      {/* Search header spans full viewport width, content centered */}
      <div className="shrink-0 border-b border-sidebar-border">
        <div className="mx-auto max-w-6xl px-4">{searchHeader}</div>
      </div>
      <DesktopLayout
        searchResults={searchResults}
        embedVisible={embedVisible}
      />
    </>
  );
}
