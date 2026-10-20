import { Clapperboard } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PlatformIcon } from "@/components/platform-icon";
import { getPlatform } from "@/lib/platforms";
import { cn } from "@/lib/utils";

export interface SourceStackItem {
  platform: string;
  /** Defaults to "recording"; clips get a small badge. */
  kind?: "recording" | "clip";
  /** Publishing Channel; shown in the mark's details. */
  channel?: string;
  /** The publishing Channel is not the Streamer's own. */
  reupload?: boolean;
}

/** Row-end platform marks, one per source. Fixed size so it never shifts layout. */
export function SourceStack({
  sources,
  max = 4,
  className,
}: {
  sources: SourceStackItem[];
  max?: number;
  className?: string;
}) {
  if (sources.length === 0) return null;
  const shown = sources.slice(0, max);
  const extra = sources.length - shown.length;
  return (
    <ul className={cn("flex shrink-0 items-center gap-1.5 text-muted-foreground", className)} aria-label="Sources">
      {shown.map((source, i) => {
        const clip = source.kind === "clip";
        const name = getPlatform(source.platform).name;
        const label = [clip ? `${name} clip` : name, source.reupload ? "reupload" : null, source.channel].filter(Boolean).join(" · ");
        return (
          <li key={`${source.platform}-${source.kind ?? "recording"}-${i}`} className="relative z-10 flex">
            <Tooltip>
              <TooltipTrigger className="relative flex size-4 items-center justify-center rounded-sm">
                <PlatformIcon platform={source.platform} decorative className="size-4" />
                {clip && <Clapperboard aria-hidden className="absolute -right-1 -bottom-1 size-2.5 rounded-sm bg-card text-foreground" />}
                <span className="sr-only">{label}</span>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          </li>
        );
      })}
      {extra > 0 && <li className="text-xs tabular-nums">+{extra}</li>}
    </ul>
  );
}
