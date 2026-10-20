"use client";

import { useState } from "react";
import { CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { dateToDay, dayToDate } from "@/lib/search-filters";
import { cn } from "@/lib/utils";

/** One optional calendar day (the label is the placeholder; clearable), as `YYYY-MM-DD`. */
function DatePicker({ label, value, onChange, disabled }: {
  label: string; value: string | null; onChange: (day: string | null) => void; disabled?: (date: Date) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const date = value ? dayToDate(value) : undefined;
  const text = date?.toLocaleDateString(undefined, { dateStyle: "medium" });
  return (
    <div className="relative min-w-0 flex-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            aria-label={text ? `${label}: ${text}` : label}
            className={cn("h-10 w-full justify-start gap-2 border-border bg-card px-3 font-normal @[40rem]:w-36", value && "pr-9", !value && "text-muted-foreground")}
          >
            <CalendarIcon className="size-3.5 shrink-0" />
            <span className="truncate text-sm">{text ?? label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            defaultMonth={date}
            disabled={disabled}
            onSelect={(next) => { onChange(next ? dateToDay(next) : null); setOpen(false); }}
          />
        </PopoverContent>
      </Popover>
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Clear ${label}`}
          onClick={() => onChange(null)}
          className="absolute right-1 top-1/2 size-7 -translate-y-1/2 text-muted-foreground"
        >
          <X />
        </Button>
      )}
    </div>
  );
}

/** From / To day filters; the range cannot be inverted. */
export function DateFilter({ from, to, onChange }: {
  from: string | null; to: string | null; onChange: (range: { from: string | null; to: string | null }) => void;
}) {
  return (
    <div className="flex min-w-0 gap-2">
      <DatePicker label="From" value={from} onChange={(day) => onChange({ from: day, to })} disabled={to ? (d) => d > dayToDate(to) : undefined} />
      <DatePicker label="To" value={to} onChange={(day) => onChange({ from, to: day })} disabled={from ? (d) => d < dayToDate(from) : undefined} />
    </div>
  );
}
