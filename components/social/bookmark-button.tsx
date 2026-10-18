"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBookmarks } from "@/components/social/bookmarks-provider";
import { cn } from "@/lib/utils";

/** Icon-only save toggle. Signed-out users are sent to sign in and back. */
export function BookmarkButton({
  matchupId,
  className,
  size = "icon-sm",
}: {
  matchupId: number;
  className?: string;
  size?: "icon-xs" | "icon-sm";
}) {
  const { enabled, signedIn, has, toggle } = useBookmarks();
  const router = useRouter();
  const pathname = usePathname();
  const query = useSearchParams().toString();

  if (!enabled) return null;
  const saved = has(matchupId);

  return (
    <Button
      variant="ghost"
      size={size}
      aria-label={saved ? "Unsave" : "Save"}
      aria-pressed={saved}
      className={cn(
        "shrink-0 transition-transform active:scale-90 motion-reduce:transition-none",
        saved
          ? "text-primary hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/15"
          : "text-muted-foreground/70 hover:bg-muted hover:text-foreground dark:hover:bg-muted",
        className,
      )}
      onClick={(event) => {
        event.stopPropagation();
        if (!signedIn) {
          router.push(`/login?next=${encodeURIComponent(pathname + (query ? `?${query}` : ""))}`);
          return;
        }
        void toggle(matchupId);
      }}
    >
      <Bookmark className={cn(saved && "fill-current")} />
    </Button>
  );
}
