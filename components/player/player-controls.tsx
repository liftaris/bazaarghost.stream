"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Search,
  X,
} from "lucide-react";
import { useEmbedActions, useEmbedState } from "@/components/embed-provider";
import { Button } from "@/components/ui/button";
import { BookmarkButton } from "@/components/social/bookmark-button";
import { SourceSwitcher } from "@/components/source-switcher";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { canSearchOpponent, opponentLabel } from "@/lib/opponent-name";
import { sourcePin } from "@/lib/sources";

/** Playback-adjacent actions always target the visibly pinned matchup, not the passive playhead. */
export function PlayerControls() {
  const {
    selectedGhost: selected,
    ghosts,
    sources,
    videoId,
    contextSessionId,
    navigationIds,
    capabilities,
  } = useEmbedState();
  const { goToGhost, hideEmbed, switchSource } = useEmbedActions();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const ids = navigationIds ?? ghosts.map((g) => g.matchup_id ?? 0);
  const index = selected?.matchup_id ? ids.indexOf(selected.matchup_id) : -1;
  const path = selected?.matchup_id
    ? `/matchups/${selected.matchup_id}`
    : contextSessionId
      ? `/recordings/${contextSessionId}`
      : null;
  const copy = async (pinned: boolean) => {
    if (!path) return;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${path}${pinned && videoId ? `?source=${sourcePin(Number(videoId.slice(2)))}` : ""}`
      );
      setCopyError(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopyError(true);
    }
  };
  return (
    <div className="@container border-t border-border">
      <div className="flex min-h-11 items-center gap-0.5 px-1.5">
        <Control
          label="Previous matchup"
          disabled={!capabilities?.navigate || index <= 0}
          onClick={() => goToGhost("prev")}
        >
          <ChevronLeft />
        </Control>
        <button
          type="button"
          className="min-w-0 flex-1 truncate rounded-md px-1 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          disabled={!selected || !capabilities?.navigate}
          onClick={() => selected && goToGhost(selected)}
        >
          {selected ? opponentLabel(selected) : "Select a matchup"}
          {index >= 0 && (
            <span className="ml-2 text-xs font-normal tabular-nums text-muted-foreground">
              {index + 1}/{ids.length}
            </span>
          )}
        </button>
        <Control
          label="Next matchup"
          disabled={
            !capabilities?.navigate || !ids.length || index === ids.length - 1 || (navigationIds !== null && !!selected && index < 0)
          }
          onClick={() => goToGhost("next")}
        >
          <ChevronRight />
        </Control>
        {selected?.matchup_id && (
          <BookmarkButton matchupId={selected.matchup_id} tooltip />
        )}
        {selected && (
          <Control
            label="Search opponent"
            className="hidden @sm:inline-flex"
            disabled={!canSearchOpponent(selected)}
            onClick={() =>
              router.push(
                `/search?q=${encodeURIComponent(selected.username!)}`,
                { scroll: false }
              )
            }
          >
            <Search />
          </Control>
        )}
        <Control
          label={copied ? "Copied matchup link" : "Copy link"}
          disabled={!path}
          onClick={() => void copy(false)}
        >
          {copied ? <Check /> : <Copy />}
        </Control>
        <Control
          label="Close player"
          onClick={() => {
            hideEmbed();
            requestAnimationFrame(() =>
              document.getElementById("companion-heading")?.focus()
            );
          }}
        >
          <X />
        </Control>
      </div>
      {(sources.length > 1 || (path && sources.length > 0)) && (
        <div className="flex min-h-8 flex-wrap items-center justify-between gap-1 border-t border-border px-2 py-1">
          <SourceSwitcher
            sources={sources}
            videoId={videoId}
            onSelect={switchSource}
          />
          <Button variant="ghost" size="xs" onClick={() => void copy(true)}>
            Copy source link
          </Button>
        </div>
      )}
      {copyError && (
        <p role="status" className="px-3 py-1 text-xs text-muted-foreground">
          Could not copy. Use this page’s address to share.
        </p>
      )}
    </div>
  );
}

function Control({
  label,
  children,
  ...props
}: { label: string } & React.ComponentProps<typeof Button>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={label} {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
