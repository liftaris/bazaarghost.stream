"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { modeOptions } from "./constants";
import type { SearchMode } from "./types";

/** The three modalities; a mode switch is a client navigation. */
export function ModeChips({ mode, onChange }: { mode: SearchMode; onChange: (mode: Exclude<SearchMode, "saved">) => void }) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      spacing={1}
      aria-label="Search for"
      value={mode === "saved" ? "" : mode}
      onValueChange={(next) => {
        const option = modeOptions.find((o) => o.value === next);
        if (option) onChange(option.value);
      }}
      className="w-full"
    >
      {modeOptions.map(({ value, label, icon: Icon }) => (
        <ToggleGroupItem
          key={value}
          value={value}
          className="flex-1 gap-1.5 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
        >
          <Icon aria-hidden className="size-4" />
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
