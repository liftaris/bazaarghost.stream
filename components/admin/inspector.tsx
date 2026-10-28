"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ChunkInspector } from "./chunk-inspector";
import { DetectionInspector } from "./detection-inspector";
import { useInspectParam } from "./hooks/use-inspect-param";
import type { InspectTarget } from "./lib/inspect";

const TITLES: Record<InspectTarget["kind"], string> = { chunk: "Chunk", detection: "Detection" };

function InspectorBody({ target }: { target: InspectTarget }) {
  return target.kind === "chunk" ? (
    <ChunkInspector key={target.id} id={target.id} />
  ) : (
    <DetectionInspector key={target.id} id={target.id} />
  );
}

/** The inspector as a sticky right column beside the main pane, on wide frames. */
export function InspectorColumn() {
  const { target, close } = useInspectParam();
  if (!target) return null;
  return (
    <aside
      aria-label="Inspector"
      className="sticky top-0 flex h-svh w-[27rem] shrink-0 flex-col border-l border-border bg-card"
    >
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
        <h2 className="text-sm font-semibold">{TITLES[target.kind]}</h2>
        <Button variant="ghost" size="icon-sm" onClick={close} aria-label="Close inspector" className="pointer-coarse:size-11">
          <X aria-hidden />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <InspectorBody target={target} />
      </div>
    </aside>
  );
}

/** The inspector as a full-height right sheet with one scrolling body, on narrow frames. */
export function InspectorSheet() {
  const { target, close } = useInspectParam();
  return (
    <Sheet open={target !== null} onOpenChange={(open) => !open && close()}>
      <SheetContent side="right" className="w-full gap-0 bg-card pr-[env(safe-area-inset-right)] sm:max-w-md">
        <SheetHeader className="border-b border-border pt-[max(1rem,env(safe-area-inset-top))]">
          <SheetTitle>{target ? TITLES[target.kind] : "Inspector"}</SheetTitle>
          <SheetDescription className="sr-only">Details of the selected item</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {target && <InspectorBody target={target} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}
