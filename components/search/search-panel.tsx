"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

import { useAuth } from "@/components/auth/auth-provider";
import { useEmbedState } from "@/components/embed-provider";
import { useSessionPlayer } from "@/components/session-player";
import { prefetch } from "@/lib/api-cache";
import type { SessionCard, StreamerCard } from "@/lib/api-contract";
import { filterParams, type PlatformFilter } from "@/lib/search-filters";

import { useSearchUrl } from "./hooks/use-search-url";
import { streamerIdOf, useStreamerOptions } from "./hooks/use-streamer-options";
import { useGhostSearch, type ListFilters } from "./hooks/use-ghost-search";
import { useRecordingSearch } from "./hooks/use-recording-search";
import { useStreamerList } from "./hooks/use-streamer-list";
import { useChannelName } from "./hooks/use-channel-name";
import { usePlatformOptions } from "./hooks/use-platform-options";
import { useSavedMatchups } from "./hooks/use-saved-matchups";

import { SearchHeader } from "./search-header";
import { SearchResults } from "./search-results";
import { SearchLayout } from "./desktop-layout";
import { SessionCompanion } from "@/components/companion/session-companion";
import { StreamerRecordings } from "./streamer-recordings";
import { DateFilter } from "./date-filter";
import { PlatformFilter as PlatformFilterButtons } from "./platform-filter";

/**
 * Top-level search workspace: the URL model ({@link useSearchUrl}) drives one list per mode on
 * the left and one right panel; nothing here remounts when the mode or selection changes.
 */
export default function SearchPanel({
  navHost,
}: {
  navHost: HTMLElement | null;
}) {
  const router = useRouter();
  const url = useSearchUrl();
  const { mode, selection, filters, setParams, selectionHref, switchMode } =
    url;
  const { playback, contextSessionId, selectedGhost, selectedMatchup } =
    useEmbedState();
  const playingSessionId = playback?.recording.sessionId ?? null;
  const startSession = useSessionPlayer();

  const listFilters = useMemo<ListFilters>(
    () => ({
      q: filters.q,
      include: filters.include,
      exclude: filters.exclude,
      from: filters.from,
      to: filters.to,
    }),
    [filters.q, filters.include, filters.exclude, filters.from, filters.to]
  );
  const platformFilter = useMemo<PlatformFilter>(
    () => ({ include: filters.include, exclude: filters.exclude }),
    [filters.include, filters.exclude]
  );
  const streamerId = streamerIdOf(url.streamerParam);

  // ---- Saved matchups ----
  const { state: authState } = useAuth();
  const savedState = useSavedMatchups({
    enabled: mode === "saved" && authState.status === "authenticated",
    query: filters.q,
  });
  useEffect(() => {
    if (
      mode === "saved" &&
      (authState.status === "anonymous" || authState.status === "disabled")
    )
      router.replace("/login?next=/saved");
  }, [mode, authState.status, router]);

  // ---- Lists (only the active mode's is enabled) ----
  const ghostList = useGhostSearch({
    filters: listFilters,
    streamerId,
    channelId: url.channelParam,
    enabled: mode === "ghosts",
  });
  const streamerList = useStreamerList({
    filters: listFilters,
    enabled: mode === "streamers",
  });
  const recordingList = useRecordingSearch({
    filters: listFilters,
    streamerId,
    enabled: mode === "recordings",
  });

  // ---- Header pieces ----
  const picker = useStreamerOptions({
    streamerId,
    onSelect: (id) => setParams({ streamer: id }),
  });
  const platforms = usePlatformOptions();
  const channelName = useChannelName(url.channelParam);

  // ---- Selection ----
  // A clicked Streamer's panel opens in the same frame; the URL catches up with the navigation
  const [pendingStreamer, setPendingStreamer] = useState<StreamerCard | null>(
    null
  );
  if (pendingStreamer && selection?.kind === "streamer")
    setPendingStreamer(null);
  const selectedStreamerId =
    selection?.kind === "streamer"
      ? selection.id
      : pendingStreamer
        ? String(pendingStreamer.id)
        : null;
  const selectedSessionId =
    selection?.kind === "recording" ? selection.id : null;

  const warmSession = useCallback((session: SessionCard) => {
    prefetch(`/sessions/${session.id}`);
    prefetch(`/recordings/${session.defaultRecording.id}/playback`);
    prefetch("/search", { sessionId: session.id, sort: "time", limit: 500 });
  }, []);

  const warmStreamer = useCallback(
    (streamer: StreamerCard) => {
      prefetch(`/streamers/${streamer.id}`);
      const { platform, excludePlatform } = filterParams({
        ...platformFilter,
        from: null,
        to: null,
      });
      prefetch("/sessions", {
        streamerId: streamer.id,
        platform,
        excludePlatform,
        limit: 50,
      });
    },
    [platformFilter]
  );

  const selectStreamer = useCallback(
    (streamer: StreamerCard) => {
      setPendingStreamer(streamer);
      router.push(selectionHref(`/streamers/${streamer.id}`), {
        scroll: false,
      });
    },
    [router, selectionHref]
  );

  const selectRecording = useCallback(
    (session: SessionCard) => {
      router.push(selectionHref(`/recordings/${session.id}`), {
        scroll: false,
      });
      void startSession(session.id, null, platformFilter).catch(
        () => undefined
      );
    },
    [router, selectionHref, startSession, platformFilter]
  );

  const playStreamerRecording = useCallback(
    (session: SessionCard) => {
      if (!selectedStreamerId) return;
      router.push(
        selectionHref(`/streamers/${selectedStreamerId}`, {
          recording: session.id,
        }),
        { scroll: false }
      );
      void startSession(session.id, null, platformFilter).catch(
        () => undefined
      );
    },
    [router, selectionHref, selectedStreamerId, startSession, platformFilter]
  );

  const goToStreamer = useCallback(
    (id: string) =>
      router.push(selectionHref(`/streamers/${encodeURIComponent(id)}`), {
        scroll: false,
      }),
    [router, selectionHref]
  );
  const ghostHref = useCallback(
    (id: number) => selectionHref(`/matchups/${id}`),
    [selectionHref]
  );

  const active =
    mode === "ghosts"
      ? ghostList
      : mode === "streamers"
        ? streamerList
        : mode === "recordings"
          ? recordingList
          : null;
  const isLoading = mode === "saved" ? savedState.isLoading : !!active?.loading;
  const error =
    mode === "saved"
      ? savedState.error
      : (picker.error ?? active?.error ?? null);
  const retry =
    mode === "saved"
      ? savedState.retry
      : picker.error
        ? picker.retry
        : active?.retry;

  const searchHeader = (
    <SearchHeader
      mode={mode}
      inputValue={url.inputValue}
      isLoading={isLoading}
      onInputChange={url.handleInputChange}
      onModeChange={switchMode}
      picker={{
        options: picker.options,
        query: picker.pickerQuery,
        onQuery: picker.setPickerQuery,
        hasMore: picker.hasMore,
        onLoadMore: picker.loadMore,
        resolved: picker.resolved,
        streamerId,
        open: picker.open,
        onOpenChange: picker.setOpen,
        onSelect: picker.select,
      }}
      channelName={channelName}
      onClearChannel={() => setParams({ channel: null })}
    />
  );

  const searchResults = (
    <>
      {mode !== "saved" && (
        <div className="@container/filters shrink-0 border-b border-sidebar-border p-3">
          <div className="flex flex-wrap items-center gap-2">
            {(mode === "ghosts" || mode === "recordings") && (
              <DateFilter
                from={filters.from}
                to={filters.to}
                onChange={(range) => setParams(range)}
              />
            )}
            <PlatformFilterButtons
              platforms={platforms}
              filter={platformFilter}
              onChange={(next) =>
                setParams({
                  platform: next.include.join(",") || null,
                  xplatform: next.exclude.join(",") || null,
                })
              }
            />
          </div>
        </div>
      )}
      {error && (
        <div role="alert" className="p-4">
          {error} <button onClick={retry}>Retry</button>
        </div>
      )}
      <SearchResults
        mode={mode}
        queryParam={filters.q}
        scrollKey={`${mode}|${url.listQuery}`}
        saved={{
          items: savedState.ghostResults,
          loading: savedState.isLoading,
          loadingMore: savedState.isLoadingMore,
          hasMore: savedState.hasMore,
          loadMore: savedState.loadMore,
          stale: false,
          empty: savedState.isEmpty,
        }}
        ghosts={{
          items: ghostList.items,
          loading: ghostList.loading,
          loadingMore: ghostList.loadingMore,
          hasMore: ghostList.hasMore,
          loadMore: ghostList.loadMore,
          stale: ghostList.isStale,
        }}
        streamers={{
          items: streamerList.items,
          loading: streamerList.loading,
          loadingMore: streamerList.loadingMore,
          hasMore: streamerList.hasMore,
          loadMore: streamerList.loadMore,
          stale: streamerList.isStale,
        }}
        recordings={{
          items: recordingList.items,
          loading: recordingList.loading,
          loadingMore: recordingList.loadingMore,
          hasMore: recordingList.hasMore,
          loadMore: recordingList.loadMore,
          stale: recordingList.isStale,
        }}
        ghostHref={ghostHref}
        selectedStreamerId={selectedStreamerId}
        selectedSessionId={selectedSessionId}
        playingSessionId={playingSessionId}
        onNavigateToStreamer={goToStreamer}
        onSelectStreamer={selectStreamer}
        onSelectRecording={selectRecording}
        onPrefetchStreamer={warmStreamer}
        onPrefetchRecording={warmSession}
      />
    </>
  );

  const detail =
    selectedStreamerId && !url.recordingParam ? (
      <StreamerRecordings
        key={selectedStreamerId}
        streamerId={selectedStreamerId}
        card={
          pendingStreamer && String(pendingStreamer.id) === selectedStreamerId
            ? pendingStreamer
            : null
        }
        filter={platformFilter}
        activeSessionId={playingSessionId}
        onPlay={playStreamerRecording}
        onPrefetch={warmSession}
      />
    ) : contextSessionId || selectedGhost || selectedMatchup ? (
      <SessionCompanion />
    ) : null;

  return (
    <>
      {navHost && createPortal(searchHeader, navHost)}
      <SearchLayout searchResults={searchResults} detail={detail} />
    </>
  );
}
