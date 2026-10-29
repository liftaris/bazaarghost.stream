"use client";

import type { ReactNode } from "react";
import { OperatorSession } from "./operator-gate";

export function OperatorConsole({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col font-[family-name:var(--font-inter)] selection:bg-primary/25 selection:text-foreground">
      <OperatorSession>{children}</OperatorSession>
    </div>
  );
}
