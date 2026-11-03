"use client";

import { useId } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LandingEntry } from "@/lib/landing/types";
import { CatalogRow } from "./catalog-row";
import { useAutoScroll } from "./use-auto-scroll";

const number = new Intl.NumberFormat("en-US");

export function CatalogColumn({
  title,
  total,
  href,
  context,
  entries,
  speed,
  empty,
}: {
  title: string;
  total: number | undefined;
  href: string;
  context: string;
  entries: LandingEntry[];
  speed: 1 | 2 | 3;
  empty: string;
}) {
  const id = useId();
  const { columnRef, viewportRef, listRef } = useAutoScroll(speed);

  return (
    <section
      ref={columnRef}
      aria-label={title}
      className="min-w-0 border-b border-border last:border-b-0 @4xl/landing:border-b-0 @4xl/landing:border-r @4xl/landing:last:border-r-0"
    >
      <Link
        href={href}
        prefetch={false}
        className="flex min-h-20 items-baseline gap-3 border-b border-border px-4 py-5 outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <span className="text-3xl tracking-tight text-hero-muted tabular-nums dark:text-primary">
          {total === undefined ? "—" : number.format(total)}
        </span>
        <h2 id={`${id}-heading`} className="text-base text-muted-foreground">
          {title}
        </h2>
        <ArrowRight
          aria-hidden
          className="ml-auto size-4 self-center text-primary"
        />
      </Link>
      <div className="px-4 py-3">
        <p className="text-sm text-muted-foreground">{context}</p>
      </div>
      <div
        ref={viewportRef}
        id={`${id}-feed`}
        role="region"
        aria-label={`${title} feed`}
        className="mx-2 h-72 overflow-y-auto overscroll-contain scroll-auto rounded-sm [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] @4xl/landing:h-88"
      >
        <ul ref={listRef} className="flex flex-col gap-1 pb-1">
          {entries.map((entry) => (
            <CatalogRow key={entry.href} entry={entry} />
          ))}
        </ul>
        {!entries.length && (
          <p className="flex min-h-44 items-center justify-center px-6 text-center text-sm text-muted-foreground">
            {empty}
          </p>
        )}
      </div>
    </section>
  );
}
