"use client";

import type { ReactNode } from "react";

/**
 * Embed region. Below `md` it is the player stack pinned above the results
 * (the results list scrolls on its own beneath it, so the player never leaves
 * the top); from `md` up it is the main pane beside the results rail. It is
 * always rendered and only hosts the PlayerSlot; the persistent PlayerHost
 * follows the slot, so the iframe is never destroyed on open/close or when
 * crossing the breakpoint.
 */
export function EmbedDrawer({ children }: { children: ReactNode }) {
  return (
    <div className="shrink-0 bg-card max-md:order-first max-md:border-b max-md:border-border md:flex md:min-h-0 md:min-w-0 md:flex-1 md:flex-col md:overflow-y-auto md:bg-background">
      {children}
    </div>
  );
}
