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
      <div className="relative mx-4 mb-4 rounded-lg border border-border bg-[color-mix(in_oklab,var(--background),black_7%)] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_2px_10px_rgb(0_0_0/0.14)] dark:bg-[color-mix(in_oklab,var(--background),black_25%)] dark:after:shadow-[inset_0_3px_12px_rgb(0_0_0/0.6)]">
        <div
          ref={viewportRef}
          id={`${id}-feed`}
          role="region"
          aria-label={`${title} feed`}
          className="h-72 overflow-y-auto overscroll-contain scroll-auto rounded-[inherit] p-2 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] @4xl/landing:h-88"
        >
          <ul ref={listRef} className="flex flex-col gap-2">
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
      </div>
    </section>
  );
}
