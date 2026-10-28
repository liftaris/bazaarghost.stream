"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useScrollEdges } from "./hooks/use-scroll-edges";

const EDGE = "pointer-events-none absolute inset-y-px w-8 from-background to-transparent";

/**
 * Hairline data table that scrolls sideways inside its own container on narrow
 * screens, fading the edge that hides columns. Children are `<thead>` and
 * `<tbody>`; cells inherit dense, tabular styling and grow to touch size on
 * coarse pointers.
 */
export function DataTable({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  const [ref, edges] = useScrollEdges<HTMLDivElement>();
  return (
    <div className={cn("relative w-full min-w-0 rounded-lg border border-border", className)}>
      <div ref={ref} className="overflow-x-auto overscroll-x-contain rounded-lg">
        <table
          aria-label={label}
          className="w-full border-collapse text-sm tabular-nums [&_td]:px-3 [&_td]:py-2 [&_td]:align-middle pointer-coarse:[&_td]:py-3 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-xs [&_th]:font-medium [&_th]:whitespace-nowrap [&_th]:text-muted-foreground [&_thead]:bg-card [&_tr]:border-b [&_tr]:border-border [&_tbody_tr:last-child]:border-b-0"
        >
          {children}
        </table>
      </div>
      {edges.before && <span aria-hidden className={cn(EDGE, "left-px rounded-l-lg bg-linear-to-r")} />}
      {edges.after && <span aria-hidden className={cn(EDGE, "right-px rounded-r-lg bg-linear-to-l")} />}
    </div>
  );
}

/** Label/value pairs in two aligned columns. */
export function FactList({ facts, className }: { facts: ReadonlyArray<readonly [string, ReactNode]>; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm tabular-nums", className)}>
      {facts.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="min-w-0 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
