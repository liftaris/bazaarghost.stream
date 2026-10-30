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
import type { Matchup, Session } from "@/lib/api-contract";
import { sessionMatchupTable } from "@/lib/session-summary";
import { HeroIcon } from "@/components/hero-icon";
import { MatchupTile } from "./matchup-tile";

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
  const columnsRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [margin, setMargin] = useState(0);
  useEffect(() => {
    const header = headerRef.current;
    const columns = columnsRef.current;
    if (!header || !columns) return;
    const measure = () => setMargin(header.offsetHeight + columns.offsetHeight);
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    observer.observe(columns);
    measure();
    return () => observer.disconnect();
  }, []);

  const { days, rows } = useMemo(() => sessionMatchupTable(matches), [matches]);
  const [focusedRun, setFocusedRun] = useState<string | null>(null);
  const rangeExtractor = useCallback(
    (range: Parameters<typeof defaultRangeExtractor>[0]) => {
      const indices = new Set(defaultRangeExtractor(range));
      const focused = rows.findIndex((run) => run.key === focusedRun);
      if (focused >= 0)
        for (
          let i = Math.max(0, focused - 1);
          i <= Math.min(rows.length - 1, focused + 1);
          i++
        )
          indices.add(i);
      return [...indices].sort((a, b) => a - b);
    },
    [rows, focusedRun]
  );
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack's measured list is intentionally not compiler-memoized
  const virtual = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    getItemKey: (i) => rows[i].key,
    scrollMargin: margin,
    estimateSize: () => 96,
    overscan: 4,
    rangeExtractor,
    useAnimationFrameWithResizeObserver: true,
  });
  const previousSelection = useRef(selectedId);
  const selectedRun = rows.findIndex((run) =>
    run.matches.some((match) => match.id === selectedId)
  );
  const selectedDay =
    matches.find((match) => match.id === selectedId)?.encounter.igd ?? null;
  useEffect(() => {
    if (previousSelection.current === selectedId || selectedRun < 0) return;
    previousSelection.current = selectedId;
    virtual.scrollToIndex(selectedRun, { align: "auto" });
    const scroller = tableScrollRef.current;
    const column = columnsRef.current?.children[days.indexOf(selectedDay) + 1];
    if (scroller && column instanceof HTMLElement) {
      const left = column.offsetLeft;
      const right = left + column.offsetWidth;
      if (left < scroller.scrollLeft + 80) scroller.scrollLeft = left - 80;
      else if (right > scroller.scrollLeft + scroller.clientWidth)
        scroller.scrollLeft = right - scroller.clientWidth;
    }
  }, [selectedId, selectedRun, selectedDay, days, virtual]);

  const gridTemplateColumns = `80px repeat(${days.length}, minmax(96px, 1fr))`;
  return (
    <div
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      style={{ overflowAnchor: "none" }}
    >
      <div ref={headerRef}>{header}</div>
      <div
        ref={tableScrollRef}
        role="region"
        aria-label="Session matchups"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- keyboard-scrollable table, including sessions with no playable source
        tabIndex={0}
        className="relative w-full overflow-x-auto overscroll-x-contain outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <div
          role="table"
          aria-label="Encounters by run and day"
          aria-rowcount={rows.length + 1}
          aria-colcount={days.length + 1}
          style={{ minWidth: 80 + days.length * 96 }}
        >
          <div role="rowgroup">
            <div
              ref={columnsRef}
              role="row"
              aria-rowindex={1}
              className="grid border-y border-border text-center text-xs text-muted-foreground"
              style={{ gridTemplateColumns }}
            >
              <div
                role="columnheader"
                className="sticky left-0 z-10 bg-background px-2 py-2"
              >
                Run
              </div>
              {days.map((day) => (
                <div
                  role="columnheader"
                  key={day ?? "unknown"}
                  className="px-2 py-2"
                >
                  {day === null ? "Unknown day" : `Day ${day}`}
                </div>
              ))}
            </div>
          </div>
          <div
            role="rowgroup"
            className="relative w-full"
            style={{ height: virtual.getTotalSize() }}
          >
            {virtual.getVirtualItems().map((row) => {
              const run = rows[row.index];
              return (
                <div
                  role="row"
                  aria-rowindex={row.index + 2}
                  key={run.key}
                  data-index={row.index}
                  ref={virtual.measureElement}
                  data-run={run.key}
                  className="absolute left-0 top-0 grid w-full border-b border-border"
                  style={{
                    gridTemplateColumns,
                    transform: `translateY(${row.start - margin}px)`,
                  }}
                  onFocusCapture={() => setFocusedRun(run.key)}
                  onBlurCapture={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget))
                      setFocusedRun(null);
                  }}
                >
                  <div
                    role="rowheader"
                    className="sticky left-0 z-10 flex flex-col items-center justify-center gap-1 border-r border-border bg-background px-2 py-2 text-xs font-medium"
                  >
                    <span>Run {run.number ?? "-"}</span>
                    <HeroIcon hero={run.hero} />
                  </div>
                  {days.map((day) => (
                    <div
                      role="cell"
                      key={day ?? "unknown"}
                      data-day={day ?? "unknown"}
                      className="flex min-w-0 flex-col gap-2 p-2"
                    >
                      {run.cells
                        .get(day)
                        ?.map((match) => (
                          <MatchupTile
                            key={match.id}
                            match={match}
                            selected={match.id === selectedId}
                            active={match.id === activeId}
                            recordingId={recordingId}
                            session={session}
                            onSelect={onSelect}
                          />
                        )) ?? (
                        <span
                          className="flex h-20 items-center justify-center text-xs text-muted-foreground"
                          aria-label="No indexed encounter"
                        >
                          —
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
