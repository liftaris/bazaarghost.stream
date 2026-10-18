"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MINI_MAX_WIDTH = 288;
const MINI_MARGIN = 16;

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
  const showRef = useRef(show);
  showRef.current = show;
  const [mini, setMini] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let raf = 0;
    let last = "";
    const tick = () => {
      const slot = slotRef.current;
      const hasBox = !!slot && slot.isConnected && slot.getClientRects().length > 0;
      let x = 0, y = 0, w = 0, h = 0;
      let isMini = false;
      let visible = showRef.current;
      if (hasBox) {
        const r = slot.getBoundingClientRect();
        x = r.left; y = r.top; w = r.width; h = r.height;
        if (w < 1 || h < 1) visible = false;
      } else {
        isMini = true;
        w = Math.min(MINI_MAX_WIDTH, window.innerWidth * 0.6);
        h = (w * 9) / 16;
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
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [slotRef]);

  return (
    <div
      ref={hostRef}
      className={cn(
        "invisible fixed left-0 top-0 z-[41] overflow-hidden bg-black",
        mini ? "rounded-md border border-border shadow-lg" : "rounded-t-[7px]"
      )}
    >
      <div id={containerId} className="size-full" />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-sm text-destructive">
          Error loading player: {error}
        </div>
      )}
      {mini && (
        <div className="absolute right-1 top-1 flex gap-1">
          <Button
            variant="secondary"
            size="icon-xs"
            aria-label="Expand player"
            onClick={onExpand}
          >
            <Maximize2 />
          </Button>
          <Button
            variant="secondary"
            size="icon-xs"
            aria-label="Close player"
            onClick={onClose}
          >
            <X />
          </Button>
        </div>
      )}
    </div>
  );
}
