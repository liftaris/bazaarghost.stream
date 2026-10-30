"use client";

import { useEffect, useRef, useState } from "react";

const SCROLL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
]);

/**
 * Move one native list at a fixed pixel speed, suspending it while being read.
 * @param speed Multiplier of the 12 CSS pixels per second base speed.
 * @returns Column, viewport, and list refs plus manual pause controls.
 */
export function useAutoScroll(speed: 1 | 2 | 3) {
  const [paused, setPaused] = useState(false);
  const columnRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const column = columnRef.current;
    const viewport = viewportRef.current;
    const list = listRef.current;
    if (!column || !viewport || !list) return;

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let hovered =
      matchMedia("(hover: hover)").matches && column.matches(":hover");
    let focused = column.contains(document.activeElement);
    let visible = false;
    let maximum = 0;
    let frame = 0;
    let previous = 0;
    let position = viewport.scrollTop;

    const tick = (now: number) => {
      if (previous)
        position += (Math.min(now - previous, 64) * speed * 12) / 1000;
      previous = now;
      if (position >= maximum) position = 0;
      viewport.scrollTop = position;
      frame = requestAnimationFrame(tick);
    };

    const sync = () => {
      cancelAnimationFrame(frame);
      previous = 0;
      position = viewport.scrollTop;
      if (
        !paused &&
        !hovered &&
        !focused &&
        visible &&
        !document.hidden &&
        !reducedMotion.matches &&
        maximum > 0
      ) {
        frame = requestAnimationFrame(tick);
      }
    };

    function enter(event: PointerEvent) {
      if (event.pointerType === "touch") return;
      hovered = true;
      sync();
    }
    function leave() {
      hovered = false;
      sync();
    }
    function focus() {
      focused = true;
      sync();
    }
    const blur = (event: FocusEvent) => {
      focused =
        event.relatedTarget instanceof Node &&
        column.contains(event.relatedTarget);
      sync();
    };
    function manual() {
      setPaused(true);
    }
    const pointer = (event: PointerEvent) => {
      if (event.pointerType === "touch" || event.target === viewport) manual();
    };
    function key(event: KeyboardEvent) {
      if (SCROLL_KEYS.has(event.key)) manual();
    }

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    const resize = new ResizeObserver(() => {
      maximum = viewport.scrollHeight - viewport.clientHeight;
      sync();
    });
    intersection.observe(viewport);
    resize.observe(viewport);
    resize.observe(list);
    column.addEventListener("pointerenter", enter);
    column.addEventListener("pointerleave", leave);
    column.addEventListener("focusin", focus);
    column.addEventListener("focusout", blur);
    viewport.addEventListener("wheel", manual, { passive: true });
    viewport.addEventListener("pointerdown", pointer);
    viewport.addEventListener("keydown", key);
    document.addEventListener("visibilitychange", sync);
    reducedMotion.addEventListener("change", sync);

    return () => {
      cancelAnimationFrame(frame);
      intersection.disconnect();
      resize.disconnect();
      column.removeEventListener("pointerenter", enter);
      column.removeEventListener("pointerleave", leave);
      column.removeEventListener("focusin", focus);
      column.removeEventListener("focusout", blur);
      viewport.removeEventListener("wheel", manual);
      viewport.removeEventListener("pointerdown", pointer);
      viewport.removeEventListener("keydown", key);
      document.removeEventListener("visibilitychange", sync);
      reducedMotion.removeEventListener("change", sync);
    };
  }, [speed, paused]);

  return { columnRef, viewportRef, listRef, paused, setPaused };
}
