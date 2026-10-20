"use client";

import { PlatformIcon } from "@/components/platform-icon";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getPlatform } from "@/lib/platforms";
import { cyclePlatform, platformState, type PlatformFilter as Filter, type PlatformState } from "@/lib/search-filters";
import { cn } from "@/lib/utils";

// Explicit light and dark colours: the shared button variants restyle backgrounds in dark mode.
const STYLES: Record<PlatformState, string> = {
  any: "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground dark:bg-card dark:hover:bg-muted",
  include: "border-accent bg-card text-accent hover:bg-accent/10 hover:text-accent dark:bg-card dark:hover:bg-accent/15",
  exclude: "border-destructive bg-destructive text-white hover:bg-destructive/90 hover:text-white dark:bg-destructive dark:hover:bg-destructive/90",
};

function labelOf(name: string, state: PlatformState) {
  return state === "include" ? `Only ${name}` : state === "exclude" ? `Excluding ${name}` : `${name}: any`;
}

/** One tri-state button per platform: any (gray) → only (orange icon) → excluding (red) → any. */
export function PlatformFilter({ platforms, filter, onChange, className }: {
  platforms: string[]; filter: Filter; onChange: (next: Filter) => void; className?: string;
}) {
  return (
    <div role="group" aria-label="Platforms" className={cn("flex shrink-0 items-center gap-1.5", className)}>
      {platforms.map((id) => {
        const state = platformState(filter, id);
        const label = labelOf(getPlatform(id).name, state);
        return (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={label}
                data-state={state}
                onClick={() => onChange(cyclePlatform(filter, id))}
                className={cn("size-9 border shadow-xs @[40rem]:size-8", STYLES[state])}
              >
                <PlatformIcon platform={id} decorative />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
