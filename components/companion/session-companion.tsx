"use client";

import { useEmbedState } from "@/components/embed-provider";
import { Ghost } from "lucide-react";
import { StreamerHeader } from "@/components/search/streamer-recordings";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { useSessionMatchups } from "./hooks/use-session-matchups";
import { useMatchupPlayer } from "./hooks/use-matchup-player";
import { useSelectedMatchup } from "./hooks/use-selected-matchup";
import { MatchupList } from "./matchup-list";
import { SessionStats } from "./session-stats";
import { SessionTitle } from "./session-title";

/** One retained streamer/session/day hierarchy, useful with sparse metadata and without video. */
export function SessionCompanion() {
  const { contextSessionId, playback, activeGhost, videoId } = useEmbedState();
  const data = useSessionMatchups(contextSessionId);
  const select = useMatchupPlayer(data.session);
  const selected = useSelectedMatchup(data.matches);
  const { selectedId, matchup: canonical } = selected;

  const session = data.session;
  const streamer = session?.streamer ?? canonical?.streamer;
  const currentPlayback =
    playback?.recording.sessionId === contextSessionId ? playback : null;
  const recording = currentPlayback?.recording;
  const title =
    session?.title ??
    recording?.title ??
    (contextSessionId ? "Play session" : "Selected matchup");

  const header = (
    <>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-3 py-2 @sm:px-4">
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {recording?.publishedAt && (
            <time dateTime={recording.publishedAt}>
              {new Date(recording.publishedAt).toLocaleDateString("en-US", {
                dateStyle: "medium",
              })}
            </time>
          )}
          {session && (
            <span
              className="inline-flex items-center gap-1"
              title="Indexed matchups"
            >
              <Ghost aria-hidden className="size-3.5" />
              <span className="sr-only">Indexed matchups: </span>
              {session.matchupCount}
            </span>
          )}
          {session?.streamerMode && <span>Hidden names observed</span>}
        </p>
        <SessionStats matches={data.matches} />
      </div>
      {data.error && (
        <p role="alert" className="px-3 py-2 text-sm">
          {data.error}{" "}
          <Button size="sm" variant="outline" onClick={data.retry}>
            Retry session
          </Button>
        </p>
      )}
      {selected.error && (
        <p role="alert" className="px-3 py-2 text-sm">
          {selected.error}{" "}
          <Button size="sm" variant="outline" onClick={selected.retry}>
            Retry matchup
          </Button>
        </p>
      )}
    </>
  );
  return (
    <section
      className="@container flex min-h-0 flex-1 flex-col"
      aria-label="Session companion"
    >
      {streamer ? (
        <StreamerHeader streamerId={String(streamer.id)} card={null}>
          <SessionTitle title={title} />
        </StreamerHeader>
      ) : (
        <div className="flex items-center gap-3 border-b border-border px-3 py-2">
          {recording && (
            <span className="max-w-[35%] truncate text-sm font-medium">
              {recording.channel.displayName}
            </span>
          )}
          <SessionTitle title={title} />
        </div>
      )}
      {data.matches.length > 0 ? (
        <MatchupList
          header={header}
          matches={data.matches}
          selectedId={selectedId}
          activeId={activeGhost?.matchup_id ?? null}
          recordingId={videoId ? Number(videoId.slice(2)) : null}
          session={session}
          onSelect={select}
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {header}
          {data.loading ? (
            <div aria-busy="true" className="flex flex-col gap-2 p-3">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : (
            !canonical &&
            !data.error && (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>No indexed matchups yet</EmptyTitle>
                  <EmptyDescription>
                    Available encounters will appear here as this session is
                    processed.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )
          )}
        </div>
      )}
      {data.loading && data.matches.length > 0 && (
        <p role="status" className="px-3 py-2 text-xs text-muted-foreground">
          Loading more session matchups…
        </p>
      )}
    </section>
  );
}
