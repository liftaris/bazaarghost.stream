"use client";

import { useEffect, useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ReportTarget } from "@/lib/reports";
import {
  useReportSnapshot,
  type ReportSnapshot,
} from "./hooks/use-report-snapshot";
import { installErrorBuffer } from "./lib/error-buffer";
import { ReportForm } from "./report-form";

function describe(target: ReportTarget) {
  const name = target.label ? ` (${target.label})` : "";
  switch (target.kind) {
    case "matchup":
      return `About matchup #${target.id}${name}.`;
    case "session":
      return `About this recording session${name}.`;
    case "streamer":
      return `About streamer ${target.label ?? target.id}.`;
    default:
      return "About this page.";
  }
}

/** Navbar flag that opens an anonymous report about whatever is on screen. */
export function ReportButton({ className }: { className?: string }) {
  const capture = useReportSnapshot();
  const [snapshot, setSnapshot] = useState<ReportSnapshot | null>(null);
  useEffect(installErrorBuffer, []);

  return (
    <Dialog
      open={!!snapshot}
      onOpenChange={(open) => setSnapshot(open ? capture() : null)}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Report an issue"
          title="Report an issue"
          className={cn("pointer-coarse:size-11", className)}
        >
          <Flag />
        </Button>
      </DialogTrigger>
      <DialogContent className="font-serif sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report an issue</DialogTitle>
          <DialogDescription>
            {snapshot && describe(snapshot.target)} Anonymous. We include
            what&apos;s on screen so we can find it.
          </DialogDescription>
        </DialogHeader>
        {snapshot && (
          <ReportForm snapshot={snapshot} onSent={() => setSnapshot(null)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
