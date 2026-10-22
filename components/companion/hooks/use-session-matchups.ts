"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { cachedGet, invalidate } from "@/lib/api-cache";
import type { Matchup, Session } from "@/lib/api-contract";
import { useEmbedActions } from "@/components/embed-provider";

interface Loaded {
  id: string;
  session: Session | null;
  matches: Matchup[];
  loading: boolean;
  error: string | null;
}

/** Load canonical session order in bounded pages, without left search filters or row-detail N+1. */
export function useSessionMatchups(id: string | null) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [attempt, setAttempt] = useState(0);
  const { setSessionNavigation } = useEmbedActions();
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    const signal = controller.signal;
    const load = async () => {
      let session: Session | null = null;
      let matches: Matchup[] = [];
      try {
        const [info, first] = await Promise.all([
          cachedGet(`/sessions/${id}`, {}, { signal }),
          cachedGet(
            "/search",
            { sessionId: id, sort: "time", limit: 500 },
            { signal }
          ),
        ]);
        session = info;
        matches = first.items;
        let cursor = first.nextCursor;
        while (!signal.aborted) {
          // The known canonical prefix owns navigation immediately, even if a later page fails.
          setSessionNavigation(session, matches);
          setLoaded({ id, session, matches, loading: !!cursor, error: null });
          if (!cursor) {
            break;
          }
          const page = await cachedGet(
            "/search",
            { sessionId: id, sort: "time", limit: 500, cursor },
            { signal }
          );
          matches = [...matches, ...page.items];
          cursor = page.nextCursor;
        }
      } catch (error) {
        if (signal.aborted) return;
        if (
          error instanceof ApiError &&
          error.status === 409 &&
          attempt === 0
        ) {
          invalidate("/search?");
          setAttempt(1);
          return;
        }
        setLoaded({
          id,
          session,
          matches,
          loading: false,
          error:
            error instanceof Error ? error.message : "Could not load session",
        });
      }
    };
    void load();
    return () => controller.abort();
  }, [id, attempt, setSessionNavigation]);
  const current = loaded?.id === id ? loaded : null;
  return {
    session: current?.session ?? null,
    matches: current?.matches ?? [],
    loading: !!id && (!current || current.loading),
    error: current?.error ?? null,
    retry: () => {
      invalidate(`/sessions/${id}`);
      invalidate("/search?");
      setAttempt((n) => n + 1);
    },
  };
}
