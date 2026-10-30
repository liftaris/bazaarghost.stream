import Link from "next/link";
import { ChevronRight, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HeroIcon } from "@/components/hero-icon";
import type { LandingEntry } from "@/lib/landing/types";

/** Open a catalog item in its existing search workspace without speculative fetching. */
export function CatalogRow({ entry }: { entry: LandingEntry }) {
  return (
    <li>
      <Link
        href={entry.href}
        prefetch={false}
        className="flex min-h-22 items-center gap-3 rounded-lg px-3 py-3 outline-none transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        {entry.visual.kind === "avatar" ? (
          <Avatar className="size-10 shrink-0">
            <AvatarImage
              src={entry.visual.url ?? undefined}
              alt=""
              loading="lazy"
            />
            <AvatarFallback>
              {entry.title.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : entry.visual.kind === "hero" ? (
          <HeroIcon hero={entry.visual.hero} className="size-10" />
        ) : (
          <Video aria-hidden className="size-8 shrink-0 text-hero-muted" />
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span
            className="line-clamp-2 text-sm [overflow-wrap:anywhere]"
            title={entry.title}
          >
            {entry.title}
          </span>
          <span
            className="truncate text-xs text-muted-foreground"
            title={entry.detail}
          >
            {entry.detail}
          </span>
        </span>
        <ChevronRight
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground"
        />
      </Link>
    </li>
  );
}
