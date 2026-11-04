"use client";

import { lazy, Suspense, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { WorkspaceContext } from "@/components/workspace-context";
import { EmbedProvider } from "@/components/embed-provider";
import { PlayerHotkeys } from "@/components/player/player-hotkeys";
import Navbar from "@/components/navbar";
import { SearchHandoffContext } from "@/components/search-handoff";
import { cn } from "@/lib/utils";
import { isWorkspacePath } from "@/lib/workspace-routes";

const loadSearch = () => import("@/components/search");
const SearchPanel = lazy(loadSearch);
// A cold workspace load needs the panel at once; fetch it with the app chunks, not after the first render.
if (typeof window !== "undefined" && isWorkspacePath(window.location.pathname)) void loadSearch();


/**
 * Single root shell: one Navbar, one EmbedProvider (which owns the persistent
 * player host) and one SearchPanel that is hidden, not unmounted, on content
 * routes so results and the player survive client navigation.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const searchHandoff = useRef<string | null>(null);
  const [searchHost, setSearchHost] = useState<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const workspace = isWorkspacePath(pathname);
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
