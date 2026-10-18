"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBookmarkActions } from "@/components/social/bookmarks-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";

export function SavedLink({ onNavigate }: { onNavigate?: () => void }) {
  const { signedIn } = useBookmarkActions();
  const { state } = useAuth();
  const active = usePathname() === "/saved";
  if (state.status === "loading") return <span className="size-9 shrink-0" aria-hidden />;
  if (!signedIn) return null;
  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className={cn(
        "hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/15",
        active ? "text-primary" : "text-foreground",
      )}
    >
      <Link href="/saved" aria-label="Saved" aria-current={active ? "page" : undefined} onClick={onNavigate}>
        <Bookmark className={cn("size-5", active && "fill-current")} />
      </Link>
    </Button>
  );
}
