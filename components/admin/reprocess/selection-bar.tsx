import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** How many chunks are ticked, a way to clear them, and the toggle for the bulk rerun form. */
export function SelectionBar({
  count,
  open,
  controls,
  onClear,
  onToggle,
}: {
  count: number;
  open: boolean;
  /** Id of the form the toggle shows and hides. */
  controls: string;
  onClear: () => void;
  onToggle: () => void;
}) {
  return (
    <div className="sticky top-2 z-20 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-primary/50 bg-card px-3 py-2">
      <p className="text-sm font-medium tabular-nums" aria-live="polite">
        {count} {count === 1 ? "chunk" : "chunks"} selected
      </p>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onClear} disabled={count === 0}>
          Clear
        </Button>
        <Button variant={open ? "outline" : "default"} size="sm" aria-expanded={open} aria-controls={open ? controls : undefined} onClick={onToggle} disabled={!open && count === 0}>
          <RotateCcw aria-hidden />
          {open ? "Hide rerun form" : "Reprocess selected"}
        </Button>
      </div>
    </div>
  );
}
