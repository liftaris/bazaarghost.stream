"use client";

import { ChevronRight, Ghost, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { StreamerWithDetections } from "@/lib/server-utils";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

interface StreamerResultRowProps {
  streamer: StreamerWithDetections;
  onNavigateToVods: (streamerId: string, name: string) => void;
}

export function StreamerResultRow({
  streamer,
  onNavigateToVods,
}: StreamerResultRowProps) {
  return (
    <button
      onClick={() =>
        onNavigateToVods(
          streamer.streamer_id,
          streamer.streamer_display_name ?? ""
        )
      }
      className="box-border flex h-[72px] w-full items-center gap-3 rounded-lg border border-border bg-card px-3 text-left transition-colors hover:border-primary/50"
    >
      <Avatar className="size-9 shrink-0">
        <AvatarImage
          src={streamer.streamer_avatar ?? undefined}
          alt={streamer.streamer_display_name ?? ""}
        />
        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
          {(streamer.streamer_display_name ?? "?")[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-card-foreground">
          {streamer.streamer_display_name}
        </p>
        <p className="text-xs text-muted-foreground">{streamer.platform}</p>
      </div>

      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}
