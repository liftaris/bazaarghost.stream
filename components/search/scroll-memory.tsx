"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Left-list scroll offsets by mode and filters, so back/forward and mode switches land where the user was. */
const positions = new Map<string, number>();

/** Remembers and restores the scroll position of the list inside it. */
export function ScrollMemory({ scrollKey, stale, children }: { scrollKey: string; stale: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (stale) return;
    const scroller = ref.current?.querySelector<HTMLElement>(".overflow-y-auto");
    if (scroller) scroller.scrollTop = positions.get(scrollKey) ?? 0;
  }, [scrollKey, stale]);
  return (
    <div
      ref={ref}
      onScrollCapture={(e) => { if (!stale) positions.set(scrollKey, (e.target as HTMLElement).scrollTop); }}
      className="flex min-h-0 flex-1 flex-col"
    >
      {children}
    </div>
  );
}
