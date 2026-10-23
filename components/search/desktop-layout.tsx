"use client";

import { useState, type ReactNode } from "react";
import { EmbedDrawer } from "@/components/embed-drawer";
import { EmbedPanel } from "@/components/embed-panel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useResizableSplit } from "@/hooks/use-resizable-split";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [mobileTab, setMobileTab] = useState("results");
  const activeTab = detail ? mobileTab : "results";
  const mobileNavigation = (
    <TabsList
      aria-label="Workspace panels"
      className="mx-3 my-2 h-11! w-auto shrink-0 md:hidden"
    >
      <TabsTrigger value="results">Search Results</TabsTrigger>
      <TabsTrigger value="details" disabled={!detail}>
        Details
      </TabsTrigger>
    </TabsList>
  );
  return (
    <Tabs
      value={activeTab}
      onValueChange={setMobileTab}
      className="min-h-0 flex-1 gap-0"
    >
      <ResizablePanelGroup
        id="search-workspace"
        data-mobile-tab={activeTab}
        orientation="horizontal"
        groupRef={split.groupRef}
        disabled={split.compact}
        onLayoutChange={split.onLayoutChange}
        onLayoutChanged={split.onLayoutChanged}
        className="min-h-0 flex-1 bg-background max-md:flex-col! max-md:[&>[data-panel]]:w-full! max-md:[&>[data-panel]]:max-h-none! max-md:[&>#results]:order-3 max-md:[&>#results]:flex-1! max-md:[&>#workspace]:order-1 max-md:[&>#workspace]:flex-none! max-md:data-[mobile-tab=details]:[&>#results]:hidden! max-md:data-[mobile-tab=details]:[&>#workspace]:flex-1!"
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
          <TabsContent
            value="results"
            forceMount
            {...(!split.compact && {
              role: "region",
              "aria-label": "Search results",
              "aria-labelledby": undefined,
            })}
            className="flex min-h-0 flex-col max-md:data-[state=inactive]:hidden"
          >
            {searchResults}
          </TabsContent>
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
            <EmbedPanel
              mobileNavigation={mobileNavigation}
              mobileTab={activeTab}
            >
              {detail && (
                <TabsContent
                  value="details"
                  forceMount
                  {...(!split.compact && {
                    role: "region",
                    "aria-label": "Session details",
                    "aria-labelledby": undefined,
                  })}
                  className="flex min-h-0 flex-col max-md:data-[state=inactive]:hidden"
                >
                  {detail}
                </TabsContent>
              )}
            </EmbedPanel>
          </EmbedDrawer>
        </ResizablePanel>
      </ResizablePanelGroup>
    </Tabs>
  );
}
