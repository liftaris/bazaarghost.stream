"use client";

import Image from "next/image";
import Link from "next/link";
import { memo, type MouseEvent } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SourceStack } from "@/components/source-stack";
import type { Hero } from "@/lib/api-contract";
import { heroLabel } from "@/lib/session-summary";
import { cn } from "@/lib/utils";
import { prefetch } from "@/lib/api-cache";
import { useEmbedActions, useEmbedState } from "@/components/embed-provider";
import type { GhostResult } from "@/lib/result-models";
import { opponentLabel } from "@/lib/opponent-name";
export type { GhostResult } from "@/lib/result-models";

const KNOWN_RANKS = new Set(["bronze", "silver", "gold", "diamond", "legend"]);

function HeroInset({ hero, className }: { hero: Hero; className: string }) {
  return (
    <span
      role="img"
      aria-label={heroLabel(hero)}
      title={heroLabel(hero)}
      data-hero-inset={hero}
      className={cn(
        "pointer-events-none absolute top-1/2 size-[104px] -translate-y-1/2 bg-border [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center]",
        className
      )}
      style={{ maskImage: `url(/heroes/insets/${hero}.webp)` }}
    />
  );
}

interface GhostResultRowProps {
  ghost: GhostResult;
  /** Selection URL; defaults to the canonical `/matchups/:id`. */
  href?: string;
  onNavigateToStreamer: (streamerId: string, name: string) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const GhostResultRow = memo(function GhostResultRow({
  ghost,
  href = `/matchups/${ghost.matchup_id}`,
  onNavigateToStreamer,
}: GhostResultRowProps) {
  const { setEmbed, setActiveGhost, setSources, setMatchupContext } =
    useEmbedActions();
  const isActive =
    useEmbedState().selectedGhost?.matchup_id === ghost.matchup_id;
  const { streamerHero, ghostHero } = ghost.matchup.encounter;

  const warm = () => {
    prefetch(`/matchups/${ghost.matchup_id}`);
    prefetch(`/recordings/${ghost.vod_id}/playback`);
  };

  // Optimistic update only; the Link performs the (single) navigation.
  const handlePlay = (e: MouseEvent) => {
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    )
      return;
    setSources(ghost.matchup.sources, ghost.matchup.session?.id ?? null);
    setEmbed(ghost.vod_source_id, ghost.frame_time_seconds, {
      streamerId: ghost.streamer_id,
      streamerName: ghost.streamer_display_name,
      streamerAvatar: ghost.streamer_avatar,
      vodTitle: ghost.vod_title,
      date: formatDate(ghost.actual_timestamp),
    });
    // After setEmbed: it clears the override when the video changes
    setActiveGhost({
      matchup_id: ghost.matchup_id,
      detection_id: String(ghost.matchup_id),
      username: ghost.username,
      nameState: ghost.nameState,
      rank: ghost.rank,
      frame_time_seconds: ghost.frame_time_seconds,
    });
    setMatchupContext(ghost.matchup);
  };

  return (
    <div
      onPointerEnter={warm}
      onFocus={warm}
      className={cn(
        "@container relative isolate box-border h-[72px] overflow-hidden rounded-lg border transition-colors focus-within:ring-2 focus-within:ring-ring",
        isActive
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/50"
      )}
    >
      {streamerHero && (
        <HeroInset hero={streamerHero} className="left-0 -scale-x-100" />
      )}
      {ghostHero && <HeroInset hero={ghostHero} className="right-0" />}
      <div className="flex h-full items-center gap-2 px-3 [--avatar-inset:16px] @[200px]:pl-[var(--avatar-inset)] @[360px]:gap-3 @[360px]:[--avatar-inset:clamp(20px,calc(50cqw_-_224px),112px)]">
        {/* Streamer avatar — hidden below 200px */}
        <Avatar className="pointer-events-none relative z-10 hidden size-9 shrink-0 @[200px]:block">
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
          <div className="flex min-w-0 items-center justify-center gap-0.5 text-sm @[320px]:gap-1">
            <span className="relative hidden min-w-0 shrink @[280px]:block">
              {ghost.streamer_id ? (
                <button
                  data-result-streamer
                  onClick={() => {
                    onNavigateToStreamer(
                      ghost.streamer_id!,
                      ghost.streamer_display_name
                    );
                  }}
                  className="relative z-10 block max-w-full truncate font-medium text-primary hover:underline"
                >
                  {ghost.streamer_display_name}
                </button>
              ) : (
                <span
                  data-result-streamer
                  className="pointer-events-none relative z-10 block truncate font-medium text-primary"
                >
                  {ghost.streamer_display_name}
                </span>
              )}
            </span>
            <span className="pointer-events-none relative z-10 hidden shrink-0 text-muted-foreground @[280px]:block">
              vs
            </span>
            {ghost.rank && KNOWN_RANKS.has(ghost.rank.toLowerCase()) && (
              <Image
                src={`/${ghost.rank.toLowerCase()}.webp`}
                alt={ghost.rank}
                width={22}
                height={22}
                unoptimized
                className="pointer-events-none relative z-10 inline-block shrink-0"
              />
            )}
            <Link
              href={href}
              scroll={false}
              prefetch={false}
              onClick={handlePlay}
              aria-current={isActive ? "true" : undefined}
              className="min-w-0 max-w-[calc(100%_-_26px)] shrink-0 font-medium text-foreground outline-none after:absolute after:inset-0 @[280px]:max-w-[calc(100%_-_50px)]"
            >
              <span className="relative z-10 block truncate">
                {opponentLabel(ghost)}
              </span>
            </Link>
          </div>
        </div>
        <div className="hidden min-w-[calc(var(--avatar-inset)_+_24px)] shrink-0 justify-end @[200px]:flex">
          <SourceStack sources={ghost.sources} />
        </div>
      </div>
    </div>
  );
});
