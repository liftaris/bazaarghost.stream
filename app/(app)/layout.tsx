import type React from "react";
import { Suspense } from "react";
import { EmbedProvider } from "@/components/embed-provider";
import SearchPanel from "@/components/search";
import Navbar from "@/components/navbar";
import { getGlobalStats } from "@/lib/server-utils";
import { showSearchTabs } from "@/flags";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [stats, searchTabs] = await Promise.all([
    getGlobalStats(),
    showSearchTabs(),
  ]);

  return (
    <EmbedProvider>
      <div className="flex h-svh flex-col overflow-hidden">
        <Navbar />
        <main className="flex min-h-0 flex-1 flex-col">
          <p className="shrink-0 border-b border-sidebar-border py-1 text-center font-mono text-xs text-muted-foreground">
            {stats ? `tracking ${stats.streamers} creators · ${stats.vods} videos · ${stats.matchups} matchups` : "Statistics temporarily unavailable"}
          </p>
          {/* children renders GhostLoader (null) on embed routes, nothing on search routes */}
          {children}
          <Suspense>
            <SearchPanel showSearchTabs={searchTabs} />
          </Suspense>
        </main>
      </div>
    </EmbedProvider>
  );
}
