"use client";

import { type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode, useRef } from "react";
import { GripVertical } from "lucide-react";
import { EmbedDrawer } from "@/components/embed-drawer";
import { EmbedPanel } from "@/components/embed-panel";

const DEFAULT_RESULTS_WIDTH = "clamp(20rem, 28%, 26rem)";
const MIN_RESULTS_PX = 200;
const MIN_EMBED_PX = 400;
const DRAG_THRESHOLD_PX = 3;

interface SearchLayoutProps {
  searchHeader: ReactNode;
  searchResults: ReactNode;
}

/**
 * The single responsive layout tree for the search workspace.
 *
 * Below `md` it is a stacked column (player on top, results scrolling beneath);
 * from `md` up it is a resizable split with a results rail (26rem at most, 200px / 400px
 * minimums, either side collapsible by dragging past its minimum; a click on
 * the handle restores the defaults). The switch is CSS only, so the results
 * list and the player are never remounted when crossing the breakpoint.
 */
export function SearchLayout({
  searchHeader,
  searchResults,
}: SearchLayoutProps) {
  const groupRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; moved: boolean } | null>(null);

  const setResultsWidth = (value: string) =>
    groupRef.current?.style.setProperty("--results-w", value);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, moved: false };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    const group = groupRef.current;
    if (!state || !group) return;
    if (Math.abs(e.clientX - state.startX) < DRAG_THRESHOLD_PX && !state.moved) return;
    state.moved = true;
    const rect = group.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let width = x;
    if (x < MIN_RESULTS_PX / 2) width = 0;
    else if (rect.width - x < MIN_EMBED_PX / 2) width = rect.width;
    else width = Math.min(Math.max(x, MIN_RESULTS_PX), rect.width - MIN_EMBED_PX);
    setResultsWidth(`${(width / rect.width) * 100}%`);
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    drag.current = null;
    if (!state || state.moved) return;
    // Plain click: expand whichever side is collapsed.
    const group = groupRef.current;
    const results = group?.firstElementChild as HTMLElement | null;
    const embed = group?.lastElementChild as HTMLElement | null;
    if (
      results && embed && group &&
      (results.offsetWidth < 1 || embed.offsetWidth < 1)
    )
      setResultsWidth(DEFAULT_RESULTS_WIDTH);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const group = groupRef.current;
    if (!group) return;
    if (e.key === "Enter") {
      e.preventDefault();
      setResultsWidth(DEFAULT_RESULTS_WIDTH);
      return;
    }
    const results = group.firstElementChild as HTMLElement | null;
    const pct = ((results?.offsetWidth ?? 0) / group.offsetWidth) * 100;
    const step = e.shiftKey ? 10 : 2;
    const next =
      e.key === "ArrowLeft" ? pct - step
      : e.key === "ArrowRight" ? pct + step
      : e.key === "Home" ? 0
      : e.key === "End" ? 100
      : null;
    if (next === null) return;
    e.preventDefault();
    setResultsWidth(`${Math.min(100, Math.max(0, next))}%`);
  };

  return (
    <>
      <div className="shrink-0 md:border-b md:border-sidebar-border">
        <div className="md:mx-auto md:max-w-6xl md:px-4">{searchHeader}</div>
      </div>
      <div
        ref={groupRef}
        style={{ "--results-w": DEFAULT_RESULTS_WIDTH } as CSSProperties}
        className="flex min-h-0 w-full flex-1 flex-col bg-background md:flex-row"
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:w-[var(--results-w)] md:flex-none md:border-r md:border-sidebar-border md:bg-sidebar md:text-sidebar-foreground">
          {searchResults}
        </div>
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize results"
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="relative hidden w-px shrink-0 cursor-col-resize touch-none items-center justify-center bg-border outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 after:absolute after:inset-y-0 after:left-1/2 after:w-2 after:-translate-x-1/2 md:flex"
        >
          <div className="z-10 flex h-6 w-3 items-center justify-center rounded-xs border bg-border">
            <GripVertical className="size-2.5" />
          </div>
        </div>
        <EmbedDrawer>
          <EmbedPanel />
        </EmbedDrawer>
      </div>
    </>
  );
}
