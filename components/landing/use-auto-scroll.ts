"use client";

import { useEffect, useRef } from "react";

export function useAutoScroll(speed: 1 | 2 | 3) {
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
    const hasKeyboardFocus = () =>
      column.contains(document.activeElement) &&
      document.activeElement?.matches(":focus-visible");
    let focused = hasKeyboardFocus();
    let touching = false;
    let touchPaused = false;
    let resumeTimer: ReturnType<typeof setTimeout> | undefined;
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
        !touchPaused &&
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
      focused = !touchPaused && hasKeyboardFocus();
      sync();
    }
    const blur = (event: FocusEvent) => {
      focused =
        event.relatedTarget instanceof Element &&
        column.contains(event.relatedTarget) &&
        event.relatedTarget.matches(":focus-visible");
      sync();
    };
    function touchStart() {
      clearTimeout(resumeTimer);
      touching = true;
      touchPaused = true;
      focused = false;
      sync();
    }
    function resumeAfterTouch() {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        touchPaused = false;
        sync();
      }, 2000);
    }
    const touchEnd = (event: TouchEvent) => {
      touching = Array.from(event.touches).some(
        (touch) =>
          touch.target instanceof Node && viewport.contains(touch.target)
      );
      if (!touching) resumeAfterTouch();
    };
    function scroll() {
      if (touchPaused && !touching) resumeAfterTouch();
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
    viewport.addEventListener("touchstart", touchStart, { passive: true });
    viewport.addEventListener("touchend", touchEnd);
    viewport.addEventListener("touchcancel", touchEnd);
    viewport.addEventListener("scroll", scroll, { passive: true });
    document.addEventListener("visibilitychange", sync);
    reducedMotion.addEventListener("change", sync);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(resumeTimer);
      intersection.disconnect();
      resize.disconnect();
      column.removeEventListener("pointerenter", enter);
      column.removeEventListener("pointerleave", leave);
      column.removeEventListener("focusin", focus);
      column.removeEventListener("focusout", blur);
      viewport.removeEventListener("touchstart", touchStart);
      viewport.removeEventListener("touchend", touchEnd);
      viewport.removeEventListener("touchcancel", touchEnd);
      viewport.removeEventListener("scroll", scroll);
      document.removeEventListener("visibilitychange", sync);
      reducedMotion.removeEventListener("change", sync);
    };
  }, [speed]);

  return { columnRef, viewportRef, listRef };
}
