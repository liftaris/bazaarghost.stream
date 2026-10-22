"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDown, Play, Radio } from "lucide-react";
import type { Matchup, Session } from "@/lib/api-contract";
import { clock, matchupTime } from "@/lib/session-navigation";
import {
  heroLabel,
  observedRuns,
  type ObservedRun,
} from "@/lib/session-summary";
import { opponentLabel } from "@/lib/opponent-name";
import { cn } from "@/lib/utils";
import { MatchupDetail } from "./matchup-detail";

type RunEntry =
  | { kind: "run"; key: string; run: ObservedRun; expanded: boolean }
  | { kind: "matchup"; key: string; matchup: Matchup };

/** Measured run-segment rows and selected player boxes, with honest unknown boundaries. */
export function MatchupList({
  matches,
  selectedId,
  activeId,
  recordingId,
  session,
  onSelect,
  header,
}: {
  matches: Matchup[];
  selectedId: number | null;
  activeId: number | null;
  recordingId: number | null;
  session: Session | null;
  onSelect: (match: Matchup) => void;
  header?: ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [margin, setMargin] = useState(0);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setMargin(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const runs = useMemo(() => observedRuns(matches), [matches]);
  const [openRuns, setOpenRuns] = useState<Record<string, boolean>>({});
  const revealedSelection = useRef<{
    id: number | null;
    runKey: string | null;
  }>({ id: null, runKey: null });
  useEffect(() => {
    if (revealedSelection.current.id !== selectedId)
      revealedSelection.current = { id: selectedId, runKey: null };
    const run = runs.find((run) =>
      run.matches.some((match) => match.id === selectedId)
    );
    if (!run || revealedSelection.current.runKey === run.key) return;
    revealedSelection.current.runKey = run.key;
    setOpenRuns((previous) =>
      previous[run.key] ? previous : { ...previous, [run.key]: true }
    );
  }, [selectedId, runs]);
  const entries = useMemo(() => {
    const entries: RunEntry[] = [];
    for (const run of runs) {
      const expanded =
        openRuns[run.key] ??
        run.matches.some((match) => match.id === selectedId);
      entries.push({ kind: "run", key: run.key, run, expanded });
      if (expanded)
        for (const matchup of run.matches)
          entries.push({
            kind: "matchup",
            key: `matchup:${matchup.id}`,
            matchup,
          });
    }
    return entries;
  }, [runs, openRuns, selectedId]);
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack's measured list is intentionally not compiler-memoized
  const virtual = useVirtualizer({
    count: entries.length,
    getScrollElement: () => scrollRef.current,
    getItemKey: (i) => entries[i].key,
    scrollMargin: margin,
    estimateSize: (i) => (entries[i].kind === "run" ? 64 : 72),
    overscan: 4,
    useAnimationFrameWithResizeObserver: true,
  });
  const previousSelection = useRef(selectedId);
  useEffect(() => {
    if (previousSelection.current === selectedId) return;
    const i = entries.findIndex(
      (e) => e.kind === "matchup" && e.matchup.id === selectedId
    );
    if (i >= 0) {
      previousSelection.current = selectedId;
      virtual.scrollToIndex(i, { align: "start" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- explicit selection only; initial rendering leaves the summary at the top
  }, [selectedId, entries, margin]);
  /* eslint-disable jsx-a11y/no-noninteractive-tabindex -- keyboard-scrollable region, including an all-disabled source list */
  return (
    <div
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      style={{ overflowAnchor: "none" }}
      role="region"
      aria-label="Session matchups"
      tabIndex={0}
    >
      <div ref={headerRef}>{header}</div>
      <div
        className="relative w-full"
        style={{ height: virtual.getTotalSize() }}
      >
        {virtual.getVirtualItems().map((row) => {
          const entry = entries[row.index];
          if (entry.kind === "run")
            return (
              <div
                key={entry.key}
                data-index={row.index}
                ref={virtual.measureElement}
                className="absolute left-0 top-0 w-full border-y border-border bg-muted/40"
                style={{ transform: `translateY(${row.start - margin}px)` }}
              >
                <h3 className="mx-auto w-full max-w-5xl">
                  <button
                    type="button"
                    aria-expanded={entry.expanded}
                    onClick={() =>
                      setOpenRuns((previous) => ({
                        ...previous,
                        [entry.key]: !entry.expanded,
                      }))
                    }
                    className="flex min-h-16 w-full items-center gap-3 px-3 py-2 text-left text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring @sm:px-4"
                  >
                    <ChevronDown
                      aria-hidden
                      className={cn(
                        "size-4 shrink-0 transition-transform motion-reduce:transition-none",
                        !entry.expanded && "-rotate-90"
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-2 text-sm font-medium">
                        <span>Run {entry.run.number ?? "-"}</span>
                        <span className="text-muted-foreground">
                          {heroLabel(entry.run.hero)}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                        {entry.run.number === null
                          ? "Run boundaries: -"
                          : "Observed segment"}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {entry.run.matches.length}{" "}
                      {entry.run.matches.length === 1 ? "matchup" : "matchups"}
                    </span>
                  </button>
                </h3>
              </div>
            );
          const match = entry.matchup;
          const selected = match.id === selectedId;
          const mapped =
            recordingId === null
              ? null
              : matchupTime(match, recordingId, session);
          const own = match.sources.find(
            (s) => s.kind === "recording" && s.available
          );
          const at = mapped ?? (own?.kind === "recording" ? own.at : null);
          const playable = match.sources.some(
            (s) => s.kind === "recording" && s.available
          );
          return (
            <div
              key={entry.key}
              data-index={row.index}
              ref={virtual.measureElement}
              className={cn(
                "absolute left-0 top-0 w-full border-b border-border",
                selected && "bg-primary/5"
              )}
              style={{ transform: `translateY(${row.start - margin}px)` }}
            >
              <button
                type="button"
                aria-current={selected ? "true" : undefined}
                aria-expanded={selected}
                aria-label={`${opponentLabel(match.opponent)}, ${match.encounter.igd === null ? "day unknown" : `day ${match.encounter.igd}`}${at === null ? "" : `, ${clock(at)}`}`}
                disabled={!playable}
                onClick={() => onSelect(match)}
                className="mx-auto flex min-h-14 w-full max-w-5xl items-center gap-3 px-3 py-3 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:opacity-50 @sm:px-4"
              >
                <Play
                  aria-hidden
                  className={cn(
                    "size-3.5 shrink-0",
                    selected
                      ? "fill-current text-foreground"
                      : "text-muted-foreground"
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {opponentLabel(match.opponent)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Day {match.encounter.igd ?? "-"} ·{" "}
                    {heroLabel(match.encounter.ghostHero)} ·{" "}
                    <span className="capitalize">
                      {match.opponent.rank ?? "-"}
                    </span>
                  </span>
                </span>
                {activeId === match.id && (
                  <Radio
                    aria-label="At playhead"
                    className="size-3.5 shrink-0 text-muted-foreground"
                  />
                )}
                <span className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {at === null ? "-" : clock(at)}
                  {mapped === null && own && (
                    <span className="block text-[10px]">
                      {own.platform} source
                    </span>
                  )}
                </span>
              </button>
              {selected && <MatchupDetail match={match} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
