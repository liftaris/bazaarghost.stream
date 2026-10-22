"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { EmbedDrawer } from "@/components/embed-drawer";
import { EmbedPanel } from "@/components/embed-panel";
import { SplitHandle } from "@/components/split-handle";
import { useStoredSplit } from "@/hooks/use-stored-split";
import { useSplitBounds } from "@/hooks/use-split-bounds";
import type { SearchMode } from "./types";
import { cn } from "@/lib/utils";

/** One responsive tree, with independent scroll regions and a locally persisted results/context split. */
export function SearchLayout({ searchHeader, searchResults, detail }: {
  mode: SearchMode; searchHeader: ReactNode; searchResults: ReactNode; detail: ReactNode;
}) {
  const split = useStoredSplit("results", 0.28);
  const group = useRef<HTMLDivElement>(null);
  const ratio = useSplitBounds(group, "x", split.ratio, 220, 360);
  return <>
    <div className="shrink-0 md:border-b md:border-sidebar-border"><div className="md:mx-auto md:max-w-6xl md:px-4">{searchHeader}</div></div>
    <div ref={group} style={{ "--results-w": `calc((100% - 0.5rem) * ${ratio})` } as CSSProperties} className="flex min-h-0 w-full flex-1 flex-col bg-background max-md:overflow-y-auto md:flex-row">
      <EmbedDrawer collapsed={ratio === 1}><EmbedPanel>{detail}</EmbedPanel></EmbedDrawer>
      <SplitHandle axis="x" label="Resize search and context" ratio={ratio} onChange={split.change} onCommit={split.commit} onRestore={split.restore} before={220} after={360} className="hidden md:order-2 md:flex" />
      <div className={cn("flex min-h-0 flex-1 flex-col overflow-hidden max-md:min-h-56 md:order-1 md:w-[var(--results-w)] md:flex-none md:bg-sidebar md:text-sidebar-foreground", ratio === 0 && "md:invisible")}>{searchResults}</div>
    </div>
  </>;
}
