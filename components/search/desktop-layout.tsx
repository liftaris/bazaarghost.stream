"use client";

import { type ReactNode } from "react";
import { EmbedDrawer } from "@/components/embed-drawer";
import { EmbedPanel } from "@/components/embed-panel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useResizableSplit } from "@/hooks/use-resizable-split";
import { cn } from "@/lib/utils";

/** Nested groups share intersecting hit targets; one mounted player at every size. */
export function SearchLayout({
  searchResults,
  detail,
}: {
  searchResults: ReactNode;
  detail: ReactNode;
}) {
  const split = useResizableSplit("results", 0.28, "results", "workspace");
  return (
    <ResizablePanelGroup
      id="search-workspace"
      orientation="horizontal"
      groupRef={split.groupRef}
      disabled={split.compact}
      onLayoutChange={split.onLayoutChange}
      onLayoutChanged={split.onLayoutChanged}
      className="min-h-0 flex-1 bg-background max-md:flex-col! max-md:overflow-y-auto! max-md:[&>[data-panel]]:w-full! max-md:[&>[data-panel]]:max-h-none! max-md:[&>#results]:order-3 max-md:[&>#results]:flex-[1_0_14rem]! max-md:[&>#workspace]:order-1 max-md:[&>#workspace]:flex-none!"
    >
      <ResizablePanel
        id="results"
        defaultSize="28%"
        minSize={220}
        collapsible
        inert={split.leadingCollapsed}
        className={cn(
          "flex min-h-0 w-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground",
          split.leadingCollapsed && "invisible"
        )}
      >
        {searchResults}
      </ResizablePanel>
      <ResizableHandle
        withHandle
        aria-label="Resize search and context"
        disableDoubleClick
        onDoubleClick={split.restore}
        onKeyDownCapture={split.restoreOnEnter}
        className="hidden w-2 md:flex"
      />
      <ResizablePanel
        id="workspace"
        minSize={360}
        collapsible
        inert={split.trailingCollapsed}
        className={cn(
          "flex min-h-0 w-full flex-col",
          split.trailingCollapsed && "invisible"
        )}
      >
        <EmbedDrawer>
          <EmbedPanel>{detail}</EmbedPanel>
        </EmbedDrawer>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
