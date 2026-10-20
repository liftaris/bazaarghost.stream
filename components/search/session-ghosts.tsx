"use client";

import { memo, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { VirtualizedResultList } from "@/components/virtualized-result-list";
import { useEmbedActions, useEmbedState } from "@/components/embed-provider";
import { cachedGet } from "@/lib/api-cache";
import type { MatchupResult, Session } from "@/lib/api-contract";
import { mapSessionTime, recordingSources } from "@/lib/sources";
import { cn } from "@/lib/utils";
import { useApiPage } from "./hooks/use-api-page";

const KNOWN_RANKS = new Set(["bronze", "silver", "gold", "diamond", "legend"]);

function clock(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h ? `${h}:${String(m).padStart(2, "0")}` : m}:${String(s).padStart(2, "0")}`;
}

/** The Session's mapping of Recordings, for ghosts the playing Recording does not carry itself. */
function useSession(id: string) {
  const [loaded, setLoaded] = useState<Session | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    cachedGet(`/sessions/${id}`, {}, { signal: controller.signal }).then(setLoaded, () => undefined);
    return () => controller.abort();
  }, [id]);
  return loaded?.id === id ? loaded : null;
}

/** Where a ghost sits in the playing Recording, or null when it does not cover it. */
function seekTime(match: MatchupResult, playingId: number, session: Session | null): number | null {
  const sources = recordingSources(match.sources);
  const own = sources.find((s) => s.recording.id === playingId);
  if (own) return own.at;
  const other = sources[0];
  return other && session ? mapSessionTime(session, other.recording.id, playingId, other.at) : null;
}

const GhostRow = memo(function GhostRow({ match, at, active, onSeek }: {
  match: MatchupResult; at: number | null; active: boolean; onSeek: (match: MatchupResult, at: number) => void;
}) {
  const rank = match.opponent.rank?.toLowerCase();
  return (
    <button
      type="button"
      disabled={at === null}
      onClick={() => at !== null && onSeek(match, at)}
      aria-current={active ? "true" : undefined}
      className={cn(
        "box-border flex h-[72px] w-full items-center gap-3 rounded-lg border px-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50",
        active ? "border-primary bg-primary/5" : "border-border bg-card enabled:hover:border-primary/50",
      )}
    >
      {rank && KNOWN_RANKS.has(rank) ? (
        <Image src={`/${rank}.webp`} alt={match.opponent.rank ?? ""} width={24} height={24} unoptimized className="shrink-0" />
      ) : (
        <span aria-hidden className="size-6 shrink-0" />
      )}
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{match.opponent.username}</span>
      {at !== null && <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{clock(at)}</span>}
    </button>
  );
});

/** A Session's ghosts in the order they happen; the one the playhead is at is highlighted, a click seeks. */
export function SessionGhosts({ sessionId }: { sessionId: string }) {
  const result = useApiPage("/search", { sessionId, sort: "time" });
  const session = useSession(sessionId);
  const { videoId, activeGhost } = useEmbedState();
  const { goToGhost } = useEmbedActions();
  const playingId = videoId ? Number(videoId.slice(2)) : null;
  const activeId = activeGhost?.matchup_id;
  const times = useMemo(
    () => new Map(result.items.map((m) => [m.id, playingId === null ? null : seekTime(m, playingId, session)])),
    [result.items, playingId, session],
  );

  if (result.items.length === 0)
    return result.loading ? (
      <div className="flex flex-col gap-2 p-2" aria-busy="true">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[72px] w-full bg-muted" />)}
      </div>
    ) : null;

  return (
    <VirtualizedResultList
      items={result.items}
      totalCount={result.items.length}
      getItemKey={(m) => m.id}
      renderItem={(m) => (
        <GhostRow
          match={m}
          at={times.get(m.id) ?? null}
          active={activeId === m.id}
          onSeek={(match, at) =>
            goToGhost({ matchup_id: match.id, detection_id: String(match.id), username: match.opponent.username, rank: match.opponent.rank, frame_time_seconds: at })
          }
        />
      )}
      onLoadMore={result.loadMore}
      isLoadingMore={result.loadingMore}
      hasMore={result.hasMore}
    />
  );
}
