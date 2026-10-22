"use client";

import { PlatformIcon } from "@/components/platform-icon";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Recording, RecordingSource } from "@/lib/api-contract";
import { getPlatform } from "@/lib/platforms";

/** Keep the current recording's platform visible, even without another source. */
export function SourceSwitcher({
  sources,
  videoId,
  recording,
  onSelect,
}: {
  sources: RecordingSource[];
  videoId: string | null;
  recording?: Pick<Recording, "platform" | "channel"> | null;
  onSelect: (source: RecordingSource) => void;
}) {
  const current = sources.find((s) => `v:${s.recording.id}` === videoId);
  const platform =
    recording?.platform ?? current?.platform ?? sources[0]?.platform;
  const channelName =
    recording?.channel.displayName ??
    current?.channel.displayName ??
    sources[0]?.channel.displayName;
  if (!platform) return null;
  if (sources.length < 2)
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex size-8 shrink-0 items-center justify-center">
            <PlatformIcon platform={platform} className="size-4" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {getPlatform(platform).name}
          {channelName ? ` · ${channelName}` : ""}
        </TooltipContent>
      </Tooltip>
    );
  return (
    <ToggleGroup
      type="single"
      size="sm"
      aria-label="Source"
      value={current ? String(current.recording.id) : ""}
      onValueChange={(id) => {
        const next = sources.find((s) => String(s.recording.id) === id);
        if (next) onSelect(next);
      }}
    >
      {sources.map((source) => {
        const label = `${getPlatform(source.platform).name}${source.isReupload ? " reupload" : ""} · ${source.channel.displayName}`;
        return (
          <Tooltip key={source.recording.id}>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value={String(source.recording.id)}
                aria-label={label}
                className="aria-checked:bg-accent aria-checked:text-foreground"
              >
                <PlatformIcon
                  platform={source.platform}
                  decorative
                  className="size-4"
                />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        );
      })}
    </ToggleGroup>
  );
}
