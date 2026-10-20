"use client";

import { PlatformIcon } from "@/components/platform-icon";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { RecordingSource } from "@/lib/api-contract";
import { getPlatform } from "@/lib/platforms";

/** Platform marks to pick where the Matchup plays; only shown when there is a choice. */
export function SourceSwitcher({
  sources,
  videoId,
  onSelect,
}: {
  sources: RecordingSource[];
  videoId: string | null;
  onSelect: (source: RecordingSource) => void;
}) {
  if (sources.length < 2) return null;
  const current = sources.find((s) => `v:${s.recording.id}` === videoId);
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
              <ToggleGroupItem value={String(source.recording.id)} aria-label={label}>
                <PlatformIcon platform={source.platform} decorative className="size-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        );
      })}
    </ToggleGroup>
  );
}
