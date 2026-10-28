import { cn } from "@/lib/utils";
import { formatCount } from "../lib/format";
import { INVENTORY_FILTERS, type InventoryFilter } from "./lib/inventory";

/** Filter chips over every channel of a streamer, each with its row count. */
export function InventoryFilterChips({
  value,
  counts,
  onChange,
}: {
  value: InventoryFilter;
  counts: Record<InventoryFilter, number>;
  onChange: (next: InventoryFilter) => void;
}) {
  return (
    <div role="group" aria-label="Show videos by state" className="flex flex-wrap gap-1.5">
      {INVENTORY_FILTERS.map((chip) => {
        const pressed = chip.value === value;
        return (
          <button
            key={chip.value}
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange(chip.value)}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-ring motion-reduce:transition-none",
              pressed
                ? "border-primary/60 bg-primary/10 font-medium text-foreground"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {chip.label}
            <span className={cn("tabular-nums", pressed ? "text-foreground" : "text-muted-foreground")}>
              {formatCount(counts[chip.value])}
            </span>
          </button>
        );
      })}
    </div>
  );
}
