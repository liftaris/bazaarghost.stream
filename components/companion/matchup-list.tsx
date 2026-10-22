"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Play, Radio } from "lucide-react";
import type { Matchup, Session } from "@/lib/api-contract";
import {
  clock,
  matchupTime,
  observedDayEntries,
} from "@/lib/session-navigation";
import { opponentLabel } from "@/lib/opponent-name";
import { cn } from "@/lib/utils";
import { MatchupDetail } from "./matchup-detail";

/** Chronological measured rows with inline selected detail; unknown days never become inferred runs. */
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
  const entries = useMemo(() => observedDayEntries(matches), [matches]);
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack's measured list is intentionally not compiler-memoized
  const virtual = useVirtualizer({
    count: entries.length,
    getScrollElement: () => scrollRef.current,
    getItemKey: (i) => entries[i].key,
    scrollMargin: margin,
    estimateSize: (i) => (entries[i].kind === "day" ? 32 : 64),
    overscan: 4,
    useAnimationFrameWithResizeObserver: true,
  });
  useEffect(() => {
    const i = entries.findIndex(
      (e) => e.kind === "matchup" && e.matchup.id === selectedId
    );
    // Expanded detail can be taller than the compact viewport. Auto alignment
    // reveals its bottom actions and hides the selected opponent's name.
    if (i >= 0) virtual.scrollToIndex(i, { align: "start" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only explicit selection moves this list, not passive playhead ticks
  }, [selectedId, margin]);
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
          if (entry.kind === "day")
            return (
              <div
                key={entry.key}
                data-index={row.index}
                ref={virtual.measureElement}
                className="absolute left-0 top-0 w-full text-xs font-medium text-muted-foreground"
                style={{ transform: `translateY(${row.start - margin}px)` }}
              >
                <div className="mx-auto w-full max-w-5xl px-3 pb-1 pt-3 @sm:px-4">
                  {entry.day === null ? "Day unknown" : `Day ${entry.day}`}
                </div>
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
                  {match.opponent.rank && (
                    <span className="text-xs capitalize text-muted-foreground">
                      {match.opponent.rank}
                    </span>
                  )}
                </span>
                {activeId === match.id && (
                  <Radio
                    aria-label="At playhead"
                    className="size-3.5 shrink-0 text-muted-foreground"
                  />
                )}
                <span className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {at === null ? "Time unknown" : clock(at)}
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
