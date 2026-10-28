"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Track an element's content width with a ResizeObserver.
 * @returns A ref callback for the element, and its width in px (`null` before the first measurement).
 */
export function useFrameWidth<T extends HTMLElement>(): [(node: T | null) => void, number | null] {
  const [width, setWidth] = useState<number | null>(null);
  const observer = useRef<ResizeObserver | null>(null);
  const ref = useCallback((node: T | null) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!node) return;
    setWidth(node.getBoundingClientRect().width);
    observer.current = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.current.observe(node);
  }, []);
  return [ref, width];
}
