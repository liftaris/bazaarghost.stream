"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useFrameWidth } from "./hooks/use-frame-width";
import { InspectorColumn, InspectorSheet } from "./inspector";
import { JumpBox } from "./jump-box";
import { SectionNav } from "./section-nav";

/** Frame width at which the inspector sits beside the list instead of over it. */
const INSPECTOR_COLUMN_MIN = 1100;

/** Navigation rail plus jump box: a side column on wide frames, a top bar on narrow ones. */
function ConsoleNav() {
  return (
    <div className="shrink-0 border-b border-border bg-card @3xl/console:sticky @3xl/console:top-0 @3xl/console:h-svh @3xl/console:w-60 @3xl/console:border-r @3xl/console:border-b-0">
      <div className="flex flex-col gap-3 p-3">
        <JumpBox />
        <SectionNav className="-mx-1 overflow-x-auto px-1 @3xl/console:mx-0 @3xl/console:px-0" />
      </div>
    </div>
  );
}

/**
 * Console layout: section nav with the jump box, the main pane, and the
 * URL-driven inspector as a column on wide frames or a sheet on narrow ones.
 */
export function ConsoleFrame({ children, className }: { children: ReactNode; className?: string }) {
  const [ref, width] = useFrameWidth<HTMLDivElement>();
  const wide = width !== null && width >= INSPECTOR_COLUMN_MIN;
  return (
    <div
      ref={ref}
      className={cn(
        "@container/console flex w-full flex-1 flex-col",
        className,
      )}
    >
      <div className="flex flex-1 flex-col @3xl/console:flex-row">
        <ConsoleNav />
        <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 @3xl/console:px-6">{children}</main>
        {wide && <InspectorColumn />}
      </div>
      {width !== null && !wide && <InspectorSheet />}
    </div>
  );
}
