"use client";

import Image from "next/image";
import Link from "next/link";
import {
  memo,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SourceStack } from "@/components/source-stack";
import { HeroIcon } from "@/components/hero-icon";
import { cn } from "@/lib/utils";
import { prefetch } from "@/lib/api-cache";
import { useEmbedActions, useEmbedState } from "@/components/embed-provider";
import type { GhostResult } from "@/lib/result-models";
import { opponentLabel } from "@/lib/opponent-name";
export type { GhostResult } from "@/lib/result-models";

const KNOWN_RANKS = new Set(["bronze", "silver", "gold", "diamond", "legend"]);



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
  const { setEmbed, setActiveGhost, setSources, setMatchupContext } = useEmbedActions();
  const isActive = useEmbedState().selectedGhost?.matchup_id === ghost.matchup_id;
  const namesRef = useRef<HTMLDivElement>(null);
  const [showHeroes, setShowHeroes] = useState(true);
  const { streamerHero, ghostHero } = ghost.matchup.encounter;

  useLayoutEffect(() => {
    const row = namesRef.current;
    if (!row) return;
    const measure = () => {
      const labels = Array.from(row.children).filter(
        (child) =>
          !child.hasAttribute("data-result-hero") &&
          child.getClientRects().length > 0
      );
      const streamerVisible = labels.some((child) =>
        child.hasAttribute("data-result-streamer")
      );
      const iconCount =
        Number(Boolean(streamerHero) && streamerVisible) +
        Number(Boolean(ghostHero));
      const gap = parseFloat(getComputedStyle(row).columnGap);
      const required =
        labels.reduce((width, child) => width + child.scrollWidth, 0) +
        iconCount * 20 +
        (labels.length + iconCount - 1) * gap;
      setShowHeroes(required <= row.clientWidth);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    measure();
    return () => observer.disconnect();
  }, [ghost, streamerHero, ghostHero]);

  const warm = () => {
    prefetch(`/matchups/${ghost.matchup_id}`);
    prefetch(`/recordings/${ghost.vod_id}/playback`);
  };

  // Optimistic update only; the Link performs the (single) navigation.
  const handlePlay = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
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
        "@container relative box-border h-[72px] overflow-hidden rounded-lg border transition-colors focus-within:ring-2 focus-within:ring-ring",
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
          <div
            ref={namesRef}
            className="flex min-w-0 items-center gap-1 text-sm"
          >
            {showHeroes && streamerHero && (
              <span
                data-result-hero
                className="hidden shrink-0 @[360px]:inline-flex"
              >
                <HeroIcon hero={streamerHero} className="size-5" />
              </span>
            )}
            {ghost.streamer_id ? (
              <button
                data-result-streamer
                onClick={() => {
                  onNavigateToStreamer(
                    ghost.streamer_id!,
                    ghost.streamer_display_name
                  );
                }}
                className="relative z-10 hidden min-w-0 shrink truncate font-medium text-primary hover:underline @[320px]:block"
              >
                {ghost.streamer_display_name}
              </button>
            ) : (
              <span
                data-result-streamer
                className="hidden min-w-0 shrink truncate font-medium text-primary @[320px]:block"
              >
                {ghost.streamer_display_name}
              </span>
            )}
            <span className="hidden shrink-0 text-muted-foreground @[320px]:block">
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
            {showHeroes && ghostHero && (
              <span
                data-result-hero
                className="hidden shrink-0 @[360px]:inline-flex"
              >
                <HeroIcon hero={ghostHero} className="size-5" />
              </span>
            )}
            <Link
              href={href}
              scroll={false}
              prefetch={false}
              onClick={handlePlay}
              aria-current={isActive ? "true" : undefined}
              className="min-w-0 shrink truncate font-medium text-foreground outline-none after:absolute after:inset-0"
            >
              {opponentLabel(ghost)}
            </Link>
          </div>
        </div>
        <SourceStack sources={ghost.sources} className="hidden @[200px]:flex" />
      </div>
    </div>
  );
});
