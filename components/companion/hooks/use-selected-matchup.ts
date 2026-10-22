"use client";

import { useEffect, useState } from "react";
import type { Matchup } from "@/lib/api-contract";
import { cachedGet } from "@/lib/api-cache";
import { useEmbedActions, useEmbedState } from "@/components/embed-provider";

/** Reuse canonical list data, fetching at most the selected detail when a sparse timeline lacks it. */
export function useSelectedMatchup(matches: Matchup[]) {
  const { selectedGhost, selectedMatchup } = useEmbedState();
  const { setMatchupContext } = useEmbedActions();
  const selectedId = selectedMatchup?.id ?? selectedGhost?.matchup_id ?? null;
  const matchup =
    selectedMatchup?.id === selectedId
      ? selectedMatchup
      : matches.find((m) => m.id === selectedId);
  const [failure, setFailure] = useState<{
    id: number;
    message: string;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!selectedId || matchup) return;
    const controller = new AbortController();
    cachedGet(
      `/matchups/${selectedId}`,
      {},
      { signal: controller.signal }
    ).then(
      (match) => {
        if (!controller.signal.aborted) {
          setMatchupContext(match);
          setFailure(null);
        }
      },
      (error) => {
        if (!controller.signal.aborted)
          setFailure({
            id: selectedId,
            message:
              error instanceof Error ? error.message : "Could not load matchup",
          });
      }
    );
    return () => controller.abort();
  }, [selectedId, matchup, setMatchupContext, attempt]);
  return {
    selectedId,
    matchup,
    error: failure?.id === selectedId ? failure.message : null,
    retry: () => setAttempt((n) => n + 1),
  };
}
