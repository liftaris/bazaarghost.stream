"use client";

import type { ReactNode } from "react";
import { Ghost, Layers } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlatformIcon } from "@/components/platform-icon";
import { getPlatform } from "@/lib/platforms";
import type { Streamer } from "@/lib/api-contract";

export type StreamerView = "matchups" | "sessions";

/** The Streamer picker, a mark per owned Channel linking out to its platform, and the Matchups / Sessions switch. */
export function StreamerProfile({ streamer, view, onViewChange, picker }: {
  streamer: Streamer | null; view: StreamerView; onViewChange: (view: StreamerView) => void; picker: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-10 items-center gap-3">
        <div className="min-w-0 flex-1">{picker}</div>
        <ul aria-label="Channels" className="flex shrink-0 items-center gap-2 text-muted-foreground">
          {streamer?.channels.map((channel) => {
            const platform = getPlatform(channel.platform);
            const href = channel.url;
            const label = `${platform.name}: ${channel.displayName}`;
            return (
              <li key={channel.id}>
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}
                    className="flex size-8 items-center justify-center rounded-md hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none">
                    <PlatformIcon platform={channel.platform} decorative className="size-5" />
                  </a>
                ) : (
                  <span title={label} className="flex size-8 items-center justify-center">
                    <PlatformIcon platform={channel.platform} className="size-5" />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <Tabs value={view} onValueChange={(next) => onViewChange(next as StreamerView)}>
        <TabsList className="w-full" variant="line">
          <TabsTrigger value="matchups" aria-label="Matchups" className="after:bg-accent data-[state=active]:text-accent">
            <Ghost className="size-4" />
          </TabsTrigger>
          <TabsTrigger value="sessions" aria-label="Sessions" className="after:bg-accent data-[state=active]:text-accent">
            <Layers className="size-4" />
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
