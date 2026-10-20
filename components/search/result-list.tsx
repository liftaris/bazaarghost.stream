"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Left-list scroll offsets by mode and filters, so back/forward and mode switches land where the user was. */
const positions = new Map<string, number>();

/**
 * Wraps a result list: previous results stay visible (dimmed) while the next ones load, and the
 * scroll position of each list is remembered.
 */
export function ResultList({ scrollKey, stale, children }: { scrollKey: string; stale: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (stale) return;
    const scroller = ref.current?.querySelector<HTMLElement>(".overflow-y-auto");
    if (scroller) scroller.scrollTop = positions.get(scrollKey) ?? 0;
  }, [scrollKey, stale]);
  return (
    <div
      ref={ref}
      aria-busy={stale}
      onScrollCapture={(e) => { if (!stale) positions.set(scrollKey, (e.target as HTMLElement).scrollTop); }}
      className={cn("flex min-h-0 flex-1 flex-col transition-[opacity,filter] duration-150", stale && "opacity-50 blur-[2px] motion-reduce:blur-none")}
    >
      {children}
    </div>
  );
}
