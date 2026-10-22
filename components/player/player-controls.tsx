"use client";

import { useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Copy,
  X,
} from "lucide-react";
import { useEmbedActions, useEmbedState } from "@/components/embed-provider";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookmarkButton } from "@/components/social/bookmark-button";
import { SourceSwitcher } from "@/components/source-switcher";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { opponentLabel } from "@/lib/opponent-name";
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
    playback,
  } = useEmbedState();
  const { goToGhost, hideEmbed, switchSource } = useEmbedActions();
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
      <div className="flex min-h-10 items-center gap-0.5 px-1.5">
        <div className="mr-auto flex shrink-0 items-center">
          <SourceSwitcher
            sources={sources}
            videoId={videoId}
            recording={playback?.recording}
            onSelect={switchSource}
          />
        </div>
        <div className="flex min-w-0 items-center gap-0.5">
          <Control
            label="Previous matchup"
            disabled={!capabilities?.navigate || index <= 0}
            onClick={() => goToGhost("prev")}
          >
            <ChevronLeft />
          </Control>
          <button
            type="button"
            className="flex min-w-0 items-center gap-2 rounded-md px-1 py-1 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            disabled={!selected || !capabilities?.navigate}
            onClick={() => selected && goToGhost(selected)}
          >
            <span className="max-w-[20ch] truncate">
              {selected ? opponentLabel(selected) : "Select a matchup"}
            </span>
            {index >= 0 && (
              <span className="hidden shrink-0 text-xs font-normal tabular-nums text-muted-foreground @md:inline">
                {index + 1}/{ids.length}
              </span>
            )}
          </button>
          <Control
            label="Next matchup"
            disabled={
              !capabilities?.navigate ||
              !ids.length ||
              index === ids.length - 1 ||
              (navigationIds !== null && !!selected && index < 0)
            }
            onClick={() => goToGhost("next")}
          >
            <ChevronRight />
          </Control>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          {selected?.matchup_id && (
            <BookmarkButton matchupId={selected.matchup_id} tooltip />
          )}
          <ButtonGroup aria-label="Copy link">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={copied ? "Copied link" : "Copy link"}
              disabled={!path}
              onClick={() => void copy(false)}
            >
              {copied ? <Check /> : <Copy />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Copy options"
                  disabled={!path}
                  className="w-6"
                >
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    disabled={!videoId || !sources.length}
                    onSelect={() => void copy(true)}
                  >
                    <Copy />
                    Copy from source
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
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
      </div>
      <span role="status" className="sr-only">
        {copied ? "Link copied" : ""}
      </span>
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
