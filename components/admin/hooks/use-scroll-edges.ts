"use client";

import { useCallback, useState } from "react";
import { scrollEdges, type ScrollEdges } from "../lib/scroll-edges";

const NONE: ScrollEdges = { before: false, after: false };

/**
 * Track which sides of a horizontal scroller hide content, across scrolling and
 * resizes of the scroller or its content.
 * @returns A ref callback for the scroller, and its {@link ScrollEdges}.
 */
export function useScrollEdges<T extends HTMLElement>(): [(node: T | null) => () => void, ScrollEdges] {
  const [edges, setEdges] = useState(NONE);
  const ref = useCallback((node: T | null) => {
    if (!node) return () => {};
    const update = () => {
      const next = scrollEdges(node);
      setEdges((prev) => (prev.before === next.before && prev.after === next.after ? prev : next));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    if (node.firstElementChild) observer.observe(node.firstElementChild);
    node.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      node.removeEventListener("scroll", update);
    };
  }, []);
  return [ref, edges];
}
