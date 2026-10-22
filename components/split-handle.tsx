"use client";

import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { GripHorizontal, GripVertical } from "lucide-react";
import { constrainSplit } from "@/lib/session-navigation";
import { cn } from "@/lib/utils";

/** Named pointer/keyboard splitter; Home/End collapse and Enter restores both panes. */
export function SplitHandle({
  axis,
  label,
  ratio,
  onChange,
  onCommit,
  onRestore,
  before,
  after,
  className,
}: {
  axis: "x" | "y";
  label: string;
  ratio: number;
  onChange: (ratio: number) => void;
  onCommit: () => void;
  onRestore: () => void;
  before: number;
  after: number;
  className?: string;
}) {
  const drag = useRef(false);
  const origin = useRef(0);
  const moved = useRef(false);
  const size = (el: HTMLElement) =>
    axis === "x"
      ? el.parentElement!.getBoundingClientRect().width - el.getBoundingClientRect().width
      : el.parentElement!.getBoundingClientRect().height - el.getBoundingClientRect().height;
  const update = (el: HTMLElement, value: number) =>
    onChange(constrainSplit(value, size(el), before, after));
  const pointer = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const position = axis === "x" ? e.clientX : e.clientY;
    // A click/double-click is not a drag: moving the handle on pointerup would
    // relocate it between the two clicks and make collapsed pointer restore fail.
    if (!moved.current && Math.abs(position - origin.current) < 2) return;
    moved.current = true;
    const rect = e.currentTarget.parentElement!.getBoundingClientRect();
    update(
      e.currentTarget,
      axis === "x"
        ? (e.clientX - rect.left) / size(e.currentTarget)
        : (e.clientY - rect.top) / size(e.currentTarget)
    );
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onRestore();
      return;
    }
    const delta = e.shiftKey ? 0.1 : 0.02;
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? 1
          : e.key === (axis === "x" ? "ArrowLeft" : "ArrowUp")
            ? ratio - delta
            : e.key === (axis === "x" ? "ArrowRight" : "ArrowDown")
              ? ratio + delta
              : null;
    if (next === null) return;
    e.preventDefault();
    update(e.currentTarget, next);
    onCommit();
  };
  /* WAI-ARIA separators with values are focusable window splitters. */
  /* eslint-disable jsx-a11y/no-noninteractive-tabindex */
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- WAI-ARIA window splitter keyboard pattern
    <div
      role="separator"
      aria-orientation={axis === "x" ? "vertical" : "horizontal"}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(ratio * 100)}
      aria-valuetext={`${Math.round(ratio * 100)} percent; Enter restores panels`}
      tabIndex={0}
      onKeyDown={key}
      onDoubleClick={onRestore}
      onPointerDown={(e) => {
        drag.current = true;
        origin.current = axis === "x" ? e.clientX : e.clientY;
        moved.current = false;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={pointer}
      onPointerUp={(e) => {
        if (drag.current) {
          pointer(e);
          drag.current = false;
          onCommit();
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      }}
      onPointerCancel={() => {
        drag.current = false;
        onCommit();
      }}
      onLostPointerCapture={() => {
        if (drag.current) {
          drag.current = false;
          onCommit();
        }
      }}
      className={cn(
        "z-10 flex shrink-0 touch-none items-center justify-center bg-border outline-none focus-visible:ring-2 focus-visible:ring-ring",
        axis === "x" ? "w-2 cursor-col-resize" : "h-2 cursor-row-resize",
        className
      )}
    >
      {axis === "x" ? (
        <GripVertical aria-hidden className="size-3.5" />
      ) : (
        <GripHorizontal aria-hidden className="size-3.5" />
      )}
    </div>
  );
}
