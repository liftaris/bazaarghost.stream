"use client";

import { PlatformIcon } from "@/components/platform-icon";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getPlatform } from "@/lib/platforms";
import { cyclePlatform, platformState, type PlatformFilter as Filter, type PlatformState } from "@/lib/search-filters";
import { cn } from "@/lib/utils";

const STYLES: Record<PlatformState, string> = {
  any: "text-muted-foreground",
  include: "border-accent bg-accent text-accent-foreground hover:bg-accent/90 hover:text-accent-foreground",
  exclude: "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground",
};

function labelOf(name: string, state: PlatformState) {
  return state === "include" ? `Only ${name}` : state === "exclude" ? `Excluding ${name}` : `${name}: any`;
}

/** One tri-state button per platform: any (gray) → only (accent) → excluding (red) → any. */
export function PlatformFilter({ platforms, filter, onChange }: {
  platforms: string[]; filter: Filter; onChange: (next: Filter) => void;
}) {
  return (
    <div role="group" aria-label="Platforms" className="flex shrink-0 items-center gap-1.5">
      {platforms.map((id) => {
        const state = platformState(filter, id);
        const label = labelOf(getPlatform(id).name, state);
        return (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={label}
                data-state={state}
                onClick={() => onChange(cyclePlatform(filter, id))}
                className={cn("border-border bg-card", STYLES[state])}
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
