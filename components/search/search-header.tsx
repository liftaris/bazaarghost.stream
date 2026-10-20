"use client";

import { type ComponentProps } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PlatformFilter as Filter } from "@/lib/search-filters";
import { DateFilter } from "./date-filter";
import { ModeChips } from "./mode-chips";
import { PlatformFilter } from "./platform-filter";
import { SearchInput } from "./search-input";
import { StreamerPicker } from "./streamer-picker";
import { modeOptions } from "./constants";
import type { SearchMode } from "./types";

interface SearchHeaderProps {
  mode: SearchMode;
  inputValue: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onModeChange: ComponentProps<typeof ModeChips>["onChange"];
  picker: ComponentProps<typeof StreamerPicker>;
  platforms: string[];
  filter: Filter;
  onFilterChange: (next: Filter) => void;
  from: string | null;
  to: string | null;
  onDatesChange: (range: { from: string | null; to: string | null }) => void;
  /** Name of the `?channel=` filter's Channel when one is active. */
  channelName: string | null;
  onClearChannel: () => void;
}

/**
 * Chips above, then per mode: picker + "vs" (Ghosts), picker (Recordings) or nothing (Streamers)
 * before the input; From/To end the input row when wide and wrap beneath it when narrow
 * (Ghosts, Recordings); the platform filter always sits beneath.
 */
export function SearchHeader({
  mode, inputValue, isLoading, onInputChange, onModeChange, picker, platforms, filter, onFilterChange,
  from, to, onDatesChange, channelName, onClearChannel,
}: SearchHeaderProps) {
  const placeholder = modeOptions.find((o) => o.value === mode)?.placeholder ?? "Search saved…";
  const hasPicker = mode === "ghosts" || mode === "recordings";
  const hasDates = hasPicker;
  return (
    <div className="relative z-50 flex flex-col gap-3 bg-background p-1">
      <div className="@container flex flex-col gap-2 py-2">
        {mode !== "saved" && <ModeChips mode={mode} onChange={onModeChange} />}
        <div className="flex flex-col gap-2 @[40rem]:flex-row @[40rem]:items-end">
          <div className="flex min-w-0 flex-1 flex-col items-stretch gap-2 @[20rem]:flex-row @[20rem]:items-center">
            {mode === "ghosts" && channelName !== null && (
              <Badge variant="outline" className="h-10 shrink-0 gap-2 px-3 text-sm">
                <span className="max-w-[8rem] truncate">{channelName}</span>
                <button type="button" aria-label="Clear channel" onClick={onClearChannel} className="-mr-1 rounded-sm p-1 opacity-50 hover:opacity-100">
                  <X className="size-3" />
                </button>
              </Badge>
            )}
            {hasPicker && <StreamerPicker {...picker} triggerClassName="@[20rem]:w-auto @[20rem]:shrink-0" />}
            {mode === "ghosts" && <span className="shrink-0 self-center text-xs font-medium text-muted-foreground">vs</span>}
            <SearchInput value={inputValue} onChange={onInputChange} placeholder={placeholder} isLoading={isLoading} />
          </div>
          {hasDates && <DateFilter from={from} to={to} onChange={onDatesChange} />}
        </div>
        {mode !== "saved" && <PlatformFilter platforms={platforms} filter={filter} onChange={onFilterChange} />}
      </div>
    </div>
  );
}
