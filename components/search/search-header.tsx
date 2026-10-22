"use client";

import { type ComponentProps } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ModeChips } from "./mode-chips";
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
  /** Name of the `?channel=` filter's Channel when one is active. */
  channelName: string | null;
  onClearChannel: () => void;
}

/** Search intent lives in the navigation; result filters stay with their list. */
export function SearchHeader({
  mode,
  inputValue,
  isLoading,
  onInputChange,
  onModeChange,
  picker,
  channelName,
  onClearChannel,
}: SearchHeaderProps) {
  const placeholder =
    modeOptions.find((o) => o.value === mode)?.placeholder ?? "Search saved…";
  const hasPicker = mode === "ghosts" || mode === "recordings";
  return (
    <div className="contents">
      <div className="col-start-2 row-start-1">
        <ModeChips mode={mode} onChange={onModeChange} />
      </div>
      <div
        role="search"
        aria-label="Workspace search"
        className="col-span-3 row-start-2 flex min-w-0 items-center gap-2 @xl/nav:col-span-1 @xl/nav:col-start-3 @xl/nav:row-start-1"
      >
        {mode === "ghosts" && channelName !== null && (
          <Badge variant="outline" className="h-9 min-w-0 shrink gap-1 px-2">
            <span className="max-w-[8rem] truncate">{channelName}</span>
            <button
              type="button"
              aria-label="Clear channel"
              onClick={onClearChannel}
              className="-mr-1 rounded-sm p-1 opacity-50 hover:opacity-100"
            >
              <X className="size-3" />
            </button>
          </Badge>
        )}
        {hasPicker && (
          <StreamerPicker
            {...picker}
            triggerClassName="h-9 w-auto max-w-40 shrink-0 px-2"
          />
        )}
        {mode === "ghosts" && (
          <span className="shrink-0 text-xs font-medium text-muted-foreground">
            vs
          </span>
        )}
        <SearchInput
          value={inputValue}
          onChange={onInputChange}
          placeholder={placeholder}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
