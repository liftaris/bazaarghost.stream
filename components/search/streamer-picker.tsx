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

interface StreamerPickerProps {
  options: StreamerOption[];
  query: string;
  onQuery: (value: string) => void;
  hasMore: boolean;
  onLoadMore: () => void;
  resolved: ResolvedStreamer | null;
  streamerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: string | null) => void;
  /** Extra className for the trigger button */
  triggerClassName?: string;
}

/**
 * Combobox-style streamer filter: a trigger showing the selected streamer (or a
 * placeholder, with a clear button) and a popover with a searchable list.
 * Used by the Ghosts and Recordings headers.
 */
export function StreamerPicker({
  options, query, onQuery, hasMore, onLoadMore, resolved, streamerId, open, onOpenChange, onSelect, triggerClassName,
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
          {resolved ? (
            <div className="flex items-center gap-1.5">
              <Avatar className="size-5">
                <AvatarImage
                  src={resolved.avatar || undefined}
                  alt=""
                />
                <AvatarFallback className="bg-primary text-[7px] text-primary-foreground">
                  {resolved.displayName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-[8rem] truncate text-sm">
                {resolved.displayName}
              </span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Streamer</span>
          )}
          {resolved ? (
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
          <CommandInput placeholder="Search streamers..." value={query} onValueChange={onQuery} />
          <CommandList>
            <CommandEmpty>No streamer found.</CommandEmpty>
            <CommandGroup>
              <CommandItem onSelect={() => onSelect(null)} className="gap-2">
                <Check
                  className={cn(
                    "size-3",
                    !streamerId ? "opacity-100" : "opacity-0"
                  )}
                />
                Any streamer
              </CommandItem>
              {options.map((s) => (
                <CommandItem
                  key={s.streamer_id}
                  value={s.streamer_display_name ?? ""}
                  onSelect={() => onSelect(s.streamer_id)}
                  className="gap-2"
                >
                  <Check
                    className={cn(
                      "size-3",
                      resolved?.id === s.streamer_id
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
            {hasMore && <CommandItem onSelect={onLoadMore}>Load more</CommandItem>}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
