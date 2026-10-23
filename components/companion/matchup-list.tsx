"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { defaultRangeExtractor, useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDown } from "lucide-react";
import type { Matchup, Session } from "@/lib/api-contract";
import { heroLabel, observedRuns } from "@/lib/session-summary";
import { cn } from "@/lib/utils";
import { MatchupDetail } from "./matchup-detail";
import { MatchupTile } from "./matchup-tile";

/** Chronological run rows of square fights, with measured wrapping and one selected player box. */
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
  const [focusedRun, setFocusedRun] = useState<string | null>(null);
  const rangeExtractor = useCallback(
    (range: Parameters<typeof defaultRangeExtractor>[0]) => {
      const indices = new Set(defaultRangeExtractor(range));
      const focused = runs.findIndex((run) => run.key === focusedRun);
      // Retain the focused run and its neighbours so Tab can reach the next run even off screen.
      if (focused >= 0)
        for (
          let i = Math.max(0, focused - 1);
          i <= Math.min(runs.length - 1, focused + 1);
          i++
        )
          indices.add(i);
      return [...indices].sort((a, b) => a - b);
    },
    [runs, focusedRun]
  );
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack's measured list is intentionally not compiler-memoized
  const virtual = useVirtualizer({
    count: runs.length,
    getScrollElement: () => scrollRef.current,
    getItemKey: (i) => runs[i].key,
    scrollMargin: margin,
    estimateSize: () => 144,
    overscan: 4,
    rangeExtractor,
    useAnimationFrameWithResizeObserver: true,
  });
  const previousSelection = useRef(selectedId);
  useEffect(() => {
    if (previousSelection.current === selectedId) return;
    const i = runs.findIndex((run) =>
      run.matches.some((match) => match.id === selectedId)
    );
    if (i >= 0) {
      previousSelection.current = selectedId;
      virtual.scrollToIndex(i, { align: "auto" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- explicit selection only; initial rendering leaves the summary at the top
  }, [selectedId, runs, margin]);
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
          const run = runs[row.index];
          const expanded = openRuns[run.key] ?? true;
          const selected = run.matches.find((match) => match.id === selectedId);
          return (
            <div
              key={run.key}
              data-index={row.index}
              ref={virtual.measureElement}
              className="absolute left-0 top-0 grid w-full grid-cols-1 gap-2 px-3 py-2 @lg:grid-cols-[6rem_minmax(0,1fr)] @sm:px-4"
              style={{ transform: `translateY(${row.start - margin}px)` }}
              onFocusCapture={() => setFocusedRun(run.key)}
              onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget))
                  setFocusedRun(null);
              }}
              data-run={run.key}
            >
              <h3 className="w-full">
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={`run-matchups-${run.matches[0].id}`}
                  onClick={() =>
                    setOpenRuns((previous) => ({
                      ...previous,
                      [run.key]: !expanded,
                    }))
                  }
                  className="flex min-h-11 w-full items-start gap-1 rounded-md py-1 text-left text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <ChevronDown
                    aria-hidden
                    className={cn(
                      "size-4 shrink-0 transition-transform motion-reduce:transition-none",
                      !expanded && "-rotate-90"
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-2 text-sm font-medium @lg:flex-col">
                      <span>Run {run.number ?? "-"}</span>
                      <span className="text-muted-foreground">
                        {heroLabel(run.hero)}
                      </span>
                    </span>
                  </span>
                </button>
              </h3>
              <div
                id={`run-matchups-${run.matches[0].id}`}
                hidden={!expanded}
                className="min-w-0"
              >
                <div className="flex w-full flex-wrap gap-1.5">
                  {run.matches.map((match) => (
                    <MatchupTile
                      key={match.id}
                      match={match}
                      selected={match.id === selectedId}
                      active={match.id === activeId}
                      recordingId={recordingId}
                      session={session}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
                {selected && (
                  <div id={`matchup-player-${selected.id}`} className="mt-2">
                    <MatchupDetail
                      match={selected}
                      runNumber={run.number}
                      recordingId={recordingId}
                      session={session}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
