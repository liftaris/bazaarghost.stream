"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useEmbed } from "@/components/embed-provider";
import { BookmarkButton } from "@/components/social/bookmark-button";
import type { GhostResult } from "@/lib/result-models";
export type { GhostResult } from "@/lib/result-models";

const KNOWN_RANKS = new Set(["bronze", "silver", "gold", "diamond", "legend"]);



interface GhostResultRowProps {
  ghost: GhostResult;
  isActive: boolean;
  onNavigateToStreamer: (streamerId: string, name: string) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function GhostResultRow({
  ghost,
  isActive,
  onNavigateToStreamer,
}: GhostResultRowProps) {
  const { setEmbed, setActiveGhost } = useEmbed();
  const router = useRouter();

  const handlePlay = () => {
    // Optimistic ghost + URL update before the player seek lands
    setActiveGhost({
      matchup_id: ghost.matchup_id,
      detection_id: ghost.detection_id,
      username: ghost.username,
      rank: ghost.rank,
      frame_time_seconds: ghost.frame_time_seconds,
    });

    const url = `/matchups/${ghost.matchup_id}`;
    router.push(url, { scroll: false });

    setEmbed(ghost.vod_source_id, ghost.frame_time_seconds, {
      streamerName: ghost.streamer_display_name,
      streamerAvatar: ghost.streamer_avatar,
      vodTitle: ghost.vod_title,
      date: formatDate(ghost.actual_timestamp),
    });
  };

  return (
    <div
      onClick={handlePlay}
      className={cn(
        "@container box-border h-[72px] cursor-pointer overflow-hidden rounded-lg border transition-colors",
        isActive
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/50"
      )}
    >
      <div className="flex h-full items-center gap-3 px-3">
        {/* Streamer avatar — hidden below 200px */}
        <Avatar className="hidden size-9 shrink-0 @[200px]:block">
          {ghost.streamer_avatar && (
            <AvatarImage
              src={ghost.streamer_avatar}
              alt={ghost.streamer_display_name}
            />
          )}
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {ghost.streamer_display_name[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
          <div className="flex min-w-0 items-center gap-1 text-sm">
            {/* Streamer name + vs — hidden below 200px */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigateToStreamer(
                  ghost.streamer_id,
                  ghost.streamer_display_name
                );
              }}
              className="hidden min-w-0 shrink truncate font-medium text-primary hover:underline @[200px]:block"
            >
              {ghost.streamer_display_name}
            </button>
            <span className="hidden shrink-0 text-muted-foreground @[200px]:block">
              vs
            </span>
            {ghost.rank && KNOWN_RANKS.has(ghost.rank.toLowerCase()) && (
              <Image
                src={`/${ghost.rank.toLowerCase()}.webp`}
                alt={ghost.rank}
                width={22}
                height={22}
                unoptimized
                className="inline-block shrink-0"
              />
            )}
            <span className="shrink-0 font-medium text-foreground">
              {ghost.username}
            </span>
          </div>
        </div>
        <BookmarkButton matchupId={ghost.matchup_id} />
      </div>
    </div>
  );
}
