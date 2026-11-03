"use client";

import { lazy, Suspense, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { WorkspaceContext } from "@/components/workspace-context";
import { EmbedProvider } from "@/components/embed-provider";
import { PlayerHotkeys } from "@/components/player/player-hotkeys";
import Navbar from "@/components/navbar";
import { SearchHandoffContext } from "@/components/search-handoff";
import { cn } from "@/lib/utils";

const SearchPanel = lazy(() => import("@/components/search"));

/** Routes that render their own content instead of the search/player workspace. */
const CONTENT_ROUTES = [
  "/login",
  "/account",
  "/how-it-works",
  "/contact",
  "/donate",
  "/admin",
];

/**
 * Single root shell: one Navbar, one EmbedProvider (which owns the persistent
 * player host) and one SearchPanel that is hidden, not unmounted, on content
 * routes so results and the player survive client navigation.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const searchHandoff = useRef<string | null>(null);
  const [searchHost, setSearchHost] = useState<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const workspace =
    pathname !== "/" &&
    !CONTENT_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );
  const [workspaceMounted, setWorkspaceMounted] = useState(workspace);
  if (workspace && !workspaceMounted) setWorkspaceMounted(true);

  return (
    <SearchHandoffContext.Provider value={searchHandoff}>
      <EmbedProvider>
        <PlayerHotkeys />
        <div
          className={cn(
            "flex flex-col",
            workspace ? "h-svh overflow-hidden" : "min-h-svh"
          )}
        >
          <Navbar
            searchRef={setSearchHost}
            workspace={workspace}
            landing={pathname === "/"}
          />
          {children}
          <main
            className={cn(
              "min-h-0 flex-1 flex-col",
              workspace ? "flex" : "hidden"
            )}
          >
            <WorkspaceContext.Provider value={workspace}>
              <Suspense>
                {workspaceMounted && <SearchPanel navHost={searchHost} />}
              </Suspense>
            </WorkspaceContext.Provider>
          </main>
        </div>
      </EmbedProvider>
    </SearchHandoffContext.Provider>
  );
}
