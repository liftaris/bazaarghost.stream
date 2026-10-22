"use client";

import { useEffect, useState, type RefObject } from "react";
import { constrainSplit } from "@/lib/session-navigation";

/** Constrain only the rendered split; hidden compact handles never rewrite the desktop preference. */
export function useSplitBounds(
  ref: RefObject<HTMLDivElement | null>,
  axis: "x" | "y",
  ratio: number,
  before: number,
  after: number,
  active = true
) {
  const [available, setAvailable] = useState<number | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !active) return;
    const handle = element.querySelector<HTMLElement>(":scope > [role=separator]");
    if (!handle) return;
    const observer = new ResizeObserver(() => {
      const handleSize = axis === "x" ? handle.offsetWidth : handle.offsetHeight;
      const size = axis === "x" ? element.clientWidth : element.clientHeight;
      setAvailable(handleSize > 0 ? Math.max(0, size - handleSize) : null);
    });
    observer.observe(element);
    observer.observe(handle);
    return () => observer.disconnect();
  }, [ref, axis, active]);
  return available === null || available === 0 ? ratio : constrainSplit(ratio, available, before, after);
}
