"use client";

import { useEmbed } from "@/components/embed-provider";
import { cn } from "@/lib/utils";

/**
 * Placeholder reserving the player's space in the page. The persistent
 * PlayerHost is positioned over it; the iframe itself never moves in the DOM.
 */
export function PlayerSlot({ className }: { className?: string }) {
  const { registerSlot } = useEmbed();
  return <div ref={registerSlot} className={cn("aspect-video w-full", className)} />;
}
