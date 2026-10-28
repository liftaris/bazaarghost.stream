import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { DETECTION_FIELDS } from "../lib/detection-fields";
import { regionBox, type FieldRead, type PercentBox } from "../lib/evidence";

/** Chips sit above their box, or below it when the box is too close to the top of the frame. */
const ROOM_ABOVE = 8;
/** Chips on boxes near the right edge align to the box's right side instead of its left. */
const RIGHT_EDGE = 70;

function chipPlacement(box: PercentBox): string {
  return cn(box.top < ROOM_ABOVE ? "top-full mt-0.5" : "bottom-full mb-0.5", box.left > RIGHT_EDGE ? "right-0" : "left-0");
}

function Outline({ read, box, selected }: { read: FieldRead; box: PercentBox; selected: boolean }) {
  const style: CSSProperties = { left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%` };
  return (
    <div
      data-region={read.field}
      style={style}
      className={cn(
        "pointer-events-none absolute rounded-[2px] ring-1 ring-black/60",
        selected ? "z-10 border-2 border-primary" : "border border-dashed border-white/90",
      )}
    >
      <span
        className={cn(
          "absolute rounded-[3px] px-1 py-px text-[11px] leading-tight font-medium whitespace-nowrap",
          chipPlacement(box),
          selected ? "bg-primary text-primary-foreground" : "bg-black/75 text-white",
        )}
      >
        {DETECTION_FIELDS[read.field].label}
      </span>
    </div>
  );
}

/**
 * Every region read from one frame, positioned in percent of the frame. The
 * selected field draws in orange on top; the others are quieter dashed boxes.
 * Overlay colours are fixed black and white because they sit on game frames,
 * not on the console surface.
 */
export function RegionOutlines({ reads, selected }: { reads: FieldRead[]; selected: FieldRead["field"] | null }) {
  const placed = reads
    .map((read) => ({ read, box: regionBox(read.evidence) }))
    .filter((entry): entry is { read: FieldRead; box: PercentBox } => entry.box !== null)
    .sort((a, b) => Number(a.read.field === selected) - Number(b.read.field === selected));
  return placed.map(({ read, box }) => (
    <Outline key={read.field} read={read} box={box} selected={read.field === selected} />
  ));
}
