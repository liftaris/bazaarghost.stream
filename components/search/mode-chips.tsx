"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { modeOptions } from "./constants";
import type { SearchMode } from "./types";

/** The three modalities; a mode switch is a client navigation. */
export function ModeChips({
  mode,
  onChange,
}: {
  mode: SearchMode;
  onChange: (mode: Exclude<SearchMode, "saved">) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="default"
      size="sm"
      spacing={1}
      aria-label="Search for"
      value={mode === "saved" ? "" : mode}
      onValueChange={(next) => {
        const option = modeOptions.find((o) => o.value === next);
        if (option) onChange(option.value);
      }}
      className="w-fit"
    >
      {modeOptions.map(({ value, label, icon: Icon }) => (
        <Tooltip key={value}>
          <TooltipTrigger asChild>
            <ToggleGroupItem
              key={value}
              value={value}
              aria-label={label}
              className="size-9 min-w-9 bg-transparent p-0 text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground aria-checked:text-[color-mix(in_srgb,var(--primary)_75%,var(--foreground))] data-[state=on]:bg-transparent data-[state=on]:text-[color-mix(in_srgb,var(--primary)_75%,var(--foreground))]"
            >
              <Icon aria-hidden className="size-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </ToggleGroup>
  );
}
