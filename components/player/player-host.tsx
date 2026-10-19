"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const MINI_MAX_WIDTH = 360;
const MINI_STRIP = 28;
const MINI_MARGIN = 16;
const SETTLE_FRAMES = 10;
/** Dispatched on window when the registered PlayerSlot element changes. */
export const SLOT_EVENT = "bazaarghost:player-slot";

interface PlayerHostProps {
  containerId: string;
  slotRef: RefObject<HTMLElement | null>;
  /** A video is loaded and not dismissed. */
  show: boolean;
  error: string | null;
  onExpand: () => void;
  onClose: () => void;
}

/**
 * The one persistent player node. Rendered by EmbedProvider at the root and
 * never unmounted or re-parented; it is positioned (fixed + transform) over
 * the currently mounted {@link PlayerSlot}, or shown as a corner mini-player
 * when no slot is rendered.
 */
export function PlayerHost({
  containerId,
  slotRef,
  show,
  error,
  onExpand,
  onClose,
}: PlayerHostProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [mini, setMini] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (!show) {
      host.style.visibility = "hidden";
      return;
    }
    let raf = 0;
    let last = "";
    let still = 0;
    const tick = () => {
      raf = 0;
      const slot = slotRef.current;
      const hasBox = !!slot && slot.isConnected && slot.getClientRects().length > 0;
      let x = 0, y = 0, w = 0, h = 0;
      let isMini = false;
      let visible = true;
      if (hasBox) {
        const r = slot.getBoundingClientRect();
        x = r.left; y = r.top; w = r.width; h = r.height;
        if (w < 1 || h < 1) visible = false;
      } else {
        isMini = true;
        w = Math.min(MINI_MAX_WIDTH, window.innerWidth - 2 * MINI_MARGIN);
        h = (w * 9) / 16 + MINI_STRIP;
        x = window.innerWidth - w - MINI_MARGIN;
        y = window.innerHeight - h - MINI_MARGIN;
      }
      const key = `${visible}|${isMini}|${x.toFixed(1)}|${y.toFixed(1)}|${w.toFixed(1)}|${h.toFixed(1)}`;
      if (key !== last) {
        last = key;
        host.style.width = `${w}px`;
        host.style.height = `${h}px`;
        host.style.transform = `translate3d(${x}px,${y}px,0)`;
        host.style.visibility = visible ? "visible" : "hidden";
        setMini(isMini);
        still = 0;
      } else {
        still++;
      }
      // Keep following (CSS transitions, layout settling) until the rect is stable
      if (still < SETTLE_FRAMES) raf = requestAnimationFrame(tick);
    };
    // Event-driven: only run frames after something that can move the slot
    const wake = () => {
      still = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onSlot = () => {
      watchSlot();
      wake();
    };
    const resize = new ResizeObserver(wake);
    resize.observe(document.body);
    let observed: HTMLElement | null = null;
    const watchSlot = () => {
      const slot = slotRef.current;
      if (slot === observed) return;
      if (observed) resize.unobserve(observed);
      if (slot) resize.observe(slot);
      observed = slot;
    };
    const passive = { capture: true, passive: true } as const;
    window.addEventListener("resize", wake);
    window.addEventListener("scroll", wake, passive);
    window.addEventListener("transitionrun", wake, passive);
    window.addEventListener("transitionend", wake, passive);
    window.addEventListener("transitioncancel", wake, passive);
    window.addEventListener(SLOT_EVENT, onSlot);
    watchSlot();
    wake();
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      window.removeEventListener("resize", wake);
      window.removeEventListener("scroll", wake, passive);
      window.removeEventListener("transitionrun", wake, passive);
      window.removeEventListener("transitionend", wake, passive);
      window.removeEventListener("transitioncancel", wake, passive);
      window.removeEventListener(SLOT_EVENT, onSlot);
    };
  }, [slotRef, show]);

  return (
    <div
      ref={hostRef}
      className={cn(
        "invisible fixed left-0 top-0 z-[41] overflow-hidden bg-black",
        mini ? "rounded-md border border-border bg-card shadow-lg" : "rounded-t-[7px] max-md:rounded-none"
      )}
    >
      <div id={containerId} className={mini ? "aspect-video w-full bg-black" : "size-full"} />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-sm text-destructive">
          Error loading player: {error}
        </div>
      )}
      {mini && (
        <div className="flex h-7 items-center justify-end gap-1 px-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-xs" aria-label="Expand player" onClick={onExpand}>
                <Maximize2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Expand player</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-xs" aria-label="Close player" onClick={onClose}>
                <X />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Close player</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
