"use client";

import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { StreamerOption, ResolvedStreamer } from "./types";

/**
 * Props for {@link StreamerPicker}.
 */
interface StreamerPickerProps {
  streamerOptions: StreamerOption[];
  pickerQuery: string; onPickerQuery: (value:string)=>void; moreCreators:boolean; onLoadCreators:()=>void;
  resolvedStreamer: ResolvedStreamer | null;
  effectiveStreamer: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (opt: StreamerOption | null) => void;
  /** Extra className for the trigger button */
  triggerClassName?: string;
}

/**
 * Combobox-style streamer filter dropdown.
 *
 * Renders a trigger button showing the selected streamer (with avatar) or a
 * placeholder, and a popover with a searchable list of all tracked streamers.
 * Includes an "Any streamer" option and an X clear button when a streamer is
 * selected.
 *
 * Used by both Ghost and VOD search modes in the {@link SearchHeader}.
 */
export function StreamerPicker({
  streamerOptions,pickerQuery,onPickerQuery,moreCreators,onLoadCreators,
  resolvedStreamer,
  effectiveStreamer,
  open,
  onOpenChange,
  onSelect,
  triggerClassName,
}: StreamerPickerProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-label="Select streamer"
          className={cn(
            "h-10 w-full justify-between border-border bg-card px-3",
            triggerClassName
          )}
        >
          {resolvedStreamer ? (
            <div className="flex items-center gap-1.5">
              <Avatar className="size-5">
                <AvatarImage
                  src={resolvedStreamer.avatar || undefined}
                  alt=""
                />
                <AvatarFallback className="bg-primary text-[7px] text-primary-foreground">
                  {resolvedStreamer.displayName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-[8rem] truncate text-sm">
                {resolvedStreamer.displayName}
              </span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Streamer</span>
          )}
          {resolvedStreamer ? (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear streamer"
              className="ml-1 shrink-0 rounded-sm p-1.5 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  e.preventDefault();
                  onSelect(null);
                }
              }}
            >
              <X className="size-3" />
            </span>
          ) : (
            <ChevronsUpDown className="ml-1 size-3 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search streamers..." value={pickerQuery} onValueChange={onPickerQuery} />
          <CommandList>
            <CommandEmpty>No streamer found.</CommandEmpty>
            <CommandGroup>
              <CommandItem onSelect={() => onSelect(null)} className="gap-2">
                <Check
                  className={cn(
                    "size-3",
                    !effectiveStreamer ? "opacity-100" : "opacity-0"
                  )}
                />
                Any streamer
              </CommandItem>
              {streamerOptions.map((s) => (
                <CommandItem
                  key={s.streamer_id}
                  value={s.streamer_display_name ?? ""}
                  onSelect={() => onSelect(s)}
                  className="gap-2"
                >
                  <Check
                    className={cn(
                      "size-3",
                      resolvedStreamer?.id === s.streamer_id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <Avatar className="size-5">
                    <AvatarImage src={s.streamer_avatar ?? undefined} alt="" />
                    <AvatarFallback className="text-[8px]">
                      {(s.streamer_display_name ?? "?")[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm">
                    {s.streamer_display_name}
                  </span>
                </CommandItem>
              ))}
            {moreCreators && <CommandItem onSelect={onLoadCreators}>Load more creators</CommandItem>}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
