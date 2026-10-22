"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Embed region. Below `md` it is the player stack pinned above the results
 * (the results list scrolls on its own beneath it, so the player never leaves
 * the top); from `md` up it is the main pane beside the results rail. It is
 * always rendered and only hosts the PlayerSlot; the persistent PlayerHost
 * follows the slot, so the iframe is never destroyed on open/close or when
 * crossing the breakpoint.
 */
export function EmbedDrawer({
  children,
  collapsed = false,
}: {
  children: ReactNode;
  collapsed?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col bg-card md:order-3 md:overflow-hidden md:bg-background",
        collapsed && "md:invisible"
      )}
    >
      {children}
    </div>
  );
}
