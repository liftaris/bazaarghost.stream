import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Hairline data table that scrolls inside its own container on narrow screens.
 * Children are `<thead>` and `<tbody>`; cells inherit dense, tabular styling.
 */
export function DataTable({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("w-full overflow-x-auto rounded-lg border border-border", className)}>
      <table
        aria-label={label}
        className="w-full border-collapse text-sm tabular-nums [&_td]:px-3 [&_td]:py-2 [&_td]:align-middle [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-xs [&_th]:font-medium [&_th]:whitespace-nowrap [&_th]:text-muted-foreground [&_thead]:bg-card [&_tr]:border-b [&_tr]:border-border [&_tbody_tr:last-child]:border-b-0"
      >
        {children}
      </table>
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
