"use client";

import Link from "next/link";
import { memo, type MouseEvent } from "react";
import { Ghost } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SourceStack } from "@/components/source-stack";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { prefetch } from "@/lib/api-cache";
import { useEmbedActions, useEmbedState } from "@/components/embed-provider";

import type { VodResult } from "@/lib/result-models";
export type { VodResult } from "@/lib/result-models";

interface VodResultRowProps {
  vod: VodResult;
  onNavigateToStreamer: (streamerId: string, name: string) => void;
  onNavigateToGhosts: (vodSourceId: string, title: string) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const VodResultRow = memo(function VodResultRow({
  vod,
  onNavigateToStreamer,
  onNavigateToGhosts,
}: VodResultRowProps) {
  const { setEmbed } = useEmbedActions();
  const isActive = useEmbedState().videoId === vod.vod_source_id;

  const warm = () => prefetch(`/recordings/${vod.vod_id}/playback`);

  // Optimistic update only; the Link performs the (single) navigation.
  const handlePlay = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    setEmbed(vod.vod_source_id, 0, {
      streamerId: vod.streamer_id,
      streamerName: vod.streamer_display_name,
      streamerAvatar: vod.streamer_avatar,
      vodTitle: vod.title,
      date: formatDate(vod.published_at),
    });
  };

  return (
    <div
      onPointerEnter={warm}
      onFocus={warm}
      className={cn(
        "relative box-border h-[72px] overflow-hidden rounded-lg border transition-colors focus-within:ring-2 focus-within:ring-ring",
        isActive
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/50"
      )}
    >
      <div className="flex h-full items-center gap-3 px-3">
        {/* Streamer avatar */}
        <Avatar className="size-9 shrink-0">
          <AvatarImage
            src={vod.streamer_avatar || undefined}
            alt={vod.streamer_display_name}
          />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {vod.streamer_display_name[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
          <div className="flex items-center gap-1.5 truncate text-sm">
            {vod.streamer_id ? (
              <button
                onClick={() => {
                  onNavigateToStreamer(vod.streamer_id!, vod.streamer_display_name);
                }}
                className="relative z-10 shrink-0 font-medium text-primary hover:underline"
              >
                {vod.streamer_display_name}
              </button>
            ) : (
              <span className="shrink-0 font-medium text-primary">{vod.streamer_display_name}</span>
            )}
            <span className="shrink-0 text-muted-foreground">&mdash;</span>
            <Link
              href={`/videos/${vod.vod_id}`}
              scroll={false}
              prefetch={false}
              onClick={handlePlay}
              aria-current={isActive ? "true" : undefined}
              className="truncate text-foreground outline-none after:absolute after:inset-0"
            >
              {vod.title}
            </Link>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {vod.ghost_count > 0 && (
              <button
                className="relative z-10"
                onClick={() => {
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
        {vod.sources && <SourceStack sources={vod.sources} />}
      </div>
    </div>
  );
});
