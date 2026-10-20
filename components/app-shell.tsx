"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { WorkspaceContext } from "@/components/workspace-context";
import { EmbedProvider } from "@/components/embed-provider";
import { PlayerHotkeys } from "@/components/player/player-hotkeys";
import Navbar from "@/components/navbar";
import SearchPanel from "@/components/search";
import { cn } from "@/lib/utils";

/** Routes that render their own content instead of the search/player workspace. */
const CONTENT_ROUTES = ["/login", "/account", "/how-it-works", "/contact", "/donate"];

/**
 * Single root shell: one Navbar, one EmbedProvider (which owns the persistent
 * player host) and one SearchPanel that is hidden, not unmounted, on content
 * routes so results and the player survive client navigation.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const workspace = !CONTENT_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  return (
    <EmbedProvider>
      <PlayerHotkeys />
      <div
        className={cn(
          "flex flex-col",
          workspace ? "h-svh overflow-hidden" : "min-h-svh"
        )}
      >
        <Navbar />
        {children}
        <main
          className={cn("min-h-0 flex-1 flex-col", workspace ? "flex" : "hidden")}
        >
          <WorkspaceContext.Provider value={workspace}>
            <Suspense>
              <SearchPanel />
            </Suspense>
          </WorkspaceContext.Provider>
        </main>
      </div>
    </EmbedProvider>
  );
}
