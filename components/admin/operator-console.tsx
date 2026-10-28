"use client";

import type { ReactNode } from "react";
import { ConsoleFrame } from "./console-frame";
import { OperatorGate } from "./operator-gate";

/** The `/admin` shell: operator gate around the console frame. */
export function OperatorConsole({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col font-[family-name:var(--font-inter)] selection:bg-primary/25 selection:text-foreground">
      <OperatorGate>
        <ConsoleFrame>{children}</ConsoleFrame>
      </OperatorGate>
    </div>
  );
}
