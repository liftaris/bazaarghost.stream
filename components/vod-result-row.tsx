"use client";

import { Ghost, Play, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEmbed } from "@/components/embed-provider";

import type { VodResult } from "@/lib/result-models";
export type { VodResult } from "@/lib/result-models";

interface VodResultRowProps {
  vod: VodResult;
  isActive: boolean;
  onNavigateToStreamer: (streamerId: string, name: string) => void;
  onNavigateToGhosts: (vodSourceId: string, title: string) => void;
  /** Optional override for the row click (used by SearchPanel for route-based navigation). */
  onRowClick?: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function VodResultRow({
  vod,
  isActive,
  onNavigateToStreamer,
  onNavigateToGhosts,
  onRowClick,
}: VodResultRowProps) {
  const { setEmbed } = useEmbed();

  const handlePlay = () => {
    setEmbed(vod.vod_source_id, 0, {
      streamerName: vod.streamer_display_name,
      streamerAvatar: vod.streamer_avatar,
      vodTitle: vod.title,
      date: formatDate(vod.published_at),
    });
    onRowClick?.();
  };

  return (
    <div
      onClick={handlePlay}
      className={cn(
        "box-border h-[72px] cursor-pointer overflow-hidden rounded-lg border transition-colors",
        isActive
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/50"
      )}
    >
      <div className="flex h-full items-center gap-3 px-3">
        {/* Streamer avatar */}
        <Avatar className="size-9 shrink-0">
          <AvatarImage
            src={vod.streamer_avatar}
            alt={vod.streamer_display_name}
          />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {vod.streamer_display_name[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
          <div className="flex items-center gap-1.5 truncate text-sm">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigateToStreamer(
                  vod.streamer_id,
                  vod.streamer_display_name
                );
              }}
              className="shrink-0 font-medium text-primary hover:underline"
            >
              {vod.streamer_display_name}
            </button>
            <span className="shrink-0 text-muted-foreground">&mdash;</span>
            <span className="truncate text-foreground">{vod.title}</span>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {vod.ghost_count > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateToGhosts(vod.vod_source_id, vod.title);
                }}
              >
                <Badge
                  variant="outline"
                  className="cursor-pointer gap-1 hover:bg-secondary"
                >
                  <Ghost className="size-3" />
                  {vod.ghost_count}
                </Badge>
              </button>
            )}
          </div>
        </div>

        {/* Play button */}
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground hover:text-primary"
          onClick={handlePlay}
          title="Play VOD"
        >
          <Play className="size-4" />
        </Button>
      </div>
    </div>
  );
}
